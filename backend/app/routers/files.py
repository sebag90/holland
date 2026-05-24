import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/files", tags=["files"])

MAX_SIZE = 25 * 1024 * 1024  # 25MB


@router.post("/upload", response_model=schemas.AttachmentOut)
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix
    stored = f"{uuid.uuid4().hex}{ext}"
    dest = Path(settings.upload_dir) / stored
    size = 0
    with dest.open("wb") as f:
        while chunk := await file.read(1024 * 64):
            size += len(chunk)
            if size > MAX_SIZE:
                f.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            f.write(chunk)
    att = models.Attachment(
        user_id=user.id,
        filename=file.filename or stored,
        stored_name=stored,
        content_type=file.content_type or "application/octet-stream",
        size=size,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.get("/{attachment_id}")
def download(
    attachment_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    att = db.get(models.Attachment, attachment_id)
    if not att:
        raise HTTPException(status_code=404)
    path = Path(settings.upload_dir) / att.stored_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(path, media_type=att.content_type, filename=att.filename)
