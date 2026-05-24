from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import create_token, get_current_user, get_or_create_user
from .. import htpasswd

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    if not htpasswd.verify(data.username, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = get_or_create_user(db, data.username)
    return schemas.TokenOut(access_token=create_token(user.id), user=schemas.UserBase.model_validate(user))


@router.get("/me", response_model=schemas.UserBase)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.get("/users", response_model=list[schemas.UserBase])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.User).order_by(models.User.name).all()
