from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[schemas.TodoOut])
def list_todos(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return (
        db.query(models.Todo)
        .options(joinedload(models.Todo.created_by))
        .order_by(models.Todo.done.asc(), models.Todo.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.TodoOut)
def add_todo(
    data: schemas.TodoIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    t = models.Todo(text=data.text.strip(), description=data.description.strip(), created_by_id=user.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{todo_id}", response_model=schemas.TodoOut)
def update_todo(
    todo_id: int,
    data: schemas.TodoPatch,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    t = db.get(models.Todo, todo_id)
    if not t:
        raise HTTPException(status_code=404)
    if data.text is not None:
        if not data.text.strip():
            raise HTTPException(status_code=400, detail="text cannot be empty")
        t.text = data.text.strip()
    if data.description is not None:
        t.description = data.description.strip()
    if data.done is not None:
        t.done = data.done
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    t = db.get(models.Todo, todo_id)
    if not t:
        raise HTTPException(status_code=404)
    db.delete(t)
    db.commit()
    return {"ok": True}
