from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/threads", tags=["threads"])


def _poll_to_out(poll: models.Poll) -> schemas.PollOut:
    return schemas.PollOut(
        id=poll.id,
        question=poll.question,
        multiple=poll.multiple,
        options=[
            schemas.PollOptionOut(
                id=o.id, text=o.text, votes=len(o.votes), voters=[v.user_id for v in o.votes]
            )
            for o in poll.options
        ],
    )


def _claim_attachments(db: Session, ids: list[int], user_id: int, *, thread_id=None, post_id=None):
    if not ids:
        return
    for att in db.query(models.Attachment).filter(models.Attachment.id.in_(ids)).all():
        if att.user_id != user_id or att.thread_id or att.post_id:
            continue
        att.thread_id = thread_id
        att.post_id = post_id


@router.get("", response_model=list[schemas.ThreadSummary])
def list_threads(
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    reply_subq = (
        db.query(models.Post.thread_id, func.count(models.Post.id).label("c"))
        .group_by(models.Post.thread_id)
        .subquery()
    )
    rows = (
        db.query(
            models.Thread,
            func.coalesce(reply_subq.c.c, 0).label("reply_count"),
            models.Poll.id.label("poll_id"),
        )
        .outerjoin(reply_subq, reply_subq.c.thread_id == models.Thread.id)
        .outerjoin(models.Poll, models.Poll.thread_id == models.Thread.id)
        .options(joinedload(models.Thread.user))
        .order_by(models.Thread.created_at.desc())
        .limit(limit)
        .all()
    )
    out = []
    for t, rc, pid in rows:
        out.append(
            schemas.ThreadSummary(
                id=t.id,
                title=t.title,
                user=schemas.UserBase.model_validate(t.user),
                created_at=t.created_at,
                reply_count=rc,
                has_poll=pid is not None,
            )
        )
    return out


@router.post("", response_model=schemas.ThreadDetail)
def create_thread(
    data: schemas.ThreadIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not data.title.strip():
        raise HTTPException(status_code=400, detail="Title required")
    t = models.Thread(user_id=user.id, title=data.title, body=data.body)
    db.add(t)
    db.flush()
    if data.poll:
        if len(data.poll.options) < 2:
            raise HTTPException(status_code=400, detail="Poll requires >=2 options")
        p = models.Poll(thread_id=t.id, question=data.poll.question, multiple=data.poll.multiple)
        db.add(p)
        db.flush()
        for opt in data.poll.options:
            db.add(models.PollOption(poll_id=p.id, text=opt))
    _claim_attachments(db, data.attachment_ids, user.id, thread_id=t.id)
    db.commit()
    return get_thread(t.id, db, user)


@router.get("/{thread_id}", response_model=schemas.ThreadDetail)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    t = (
        db.query(models.Thread)
        .options(
            joinedload(models.Thread.user),
            joinedload(models.Thread.attachments),
            joinedload(models.Thread.posts).joinedload(models.Post.user),
            joinedload(models.Thread.posts).joinedload(models.Post.attachments),
            joinedload(models.Thread.poll).joinedload(models.Poll.options).joinedload(models.PollOption.votes),
        )
        .filter(models.Thread.id == thread_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404)
    return schemas.ThreadDetail(
        id=t.id,
        title=t.title,
        body=t.body,
        user=schemas.UserBase.model_validate(t.user),
        created_at=t.created_at,
        posts=[
            schemas.PostOut(
                id=p.id,
                user=schemas.UserBase.model_validate(p.user),
                body=p.body,
                created_at=p.created_at,
                attachments=[schemas.AttachmentOut.model_validate(a) for a in p.attachments],
            )
            for p in sorted(t.posts, key=lambda p: p.created_at)
        ],
        poll=_poll_to_out(t.poll) if t.poll else None,
        attachments=[schemas.AttachmentOut.model_validate(a) for a in t.attachments],
    )


@router.delete("/{thread_id}")
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    t = db.get(models.Thread, thread_id)
    if not t:
        raise HTTPException(status_code=404)
    if t.user_id != user.id:
        raise HTTPException(status_code=403)
    db.delete(t)
    db.commit()
    return {"ok": True}


@router.post("/{thread_id}/posts", response_model=schemas.PostOut)
def add_post(
    thread_id: int,
    data: schemas.PostIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    t = db.get(models.Thread, thread_id)
    if not t:
        raise HTTPException(status_code=404)
    p = models.Post(thread_id=thread_id, user_id=user.id, body=data.body)
    db.add(p)
    db.flush()
    _claim_attachments(db, data.attachment_ids, user.id, post_id=p.id)
    db.commit()
    db.refresh(p)
    return schemas.PostOut(
        id=p.id,
        user=schemas.UserBase.model_validate(user),
        body=p.body,
        created_at=p.created_at,
        attachments=[schemas.AttachmentOut.model_validate(a) for a in p.attachments],
    )


@router.post("/{thread_id}/poll/vote", response_model=schemas.PollOut)
def vote(
    thread_id: int,
    data: schemas.VoteIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    poll = db.query(models.Poll).filter_by(thread_id=thread_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="No poll")
    valid_ids = {o.id for o in poll.options}
    chosen = [oid for oid in data.option_ids if oid in valid_ids]
    if not chosen:
        raise HTTPException(status_code=400, detail="No valid options")
    if not poll.multiple and len(chosen) > 1:
        raise HTTPException(status_code=400, detail="Single-choice poll")
    # Remove previous votes
    db.query(models.PollVote).filter(
        models.PollVote.user_id == user.id,
        models.PollVote.option_id.in_(valid_ids),
    ).delete(synchronize_session=False)
    for oid in chosen:
        db.add(models.PollVote(option_id=oid, user_id=user.id))
    db.commit()
    db.refresh(poll)
    return _poll_to_out(poll)
