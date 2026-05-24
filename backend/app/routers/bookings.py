from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _overlap_query(db: Session, start: date, end: date, exclude_id: int | None = None):
    q = db.query(models.Booking).filter(
        and_(models.Booking.start_date < end, models.Booking.end_date > start)
    )
    if exclude_id:
        q = q.filter(models.Booking.id != exclude_id)
    return q


def _can_modify(b: models.Booking, user: models.User) -> bool:
    # external: anyone can modify; internal: only creator
    return b.kind == "external" or b.user_id == user.id


@router.get("", response_model=list[schemas.BookingOut])
def list_bookings(
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Booking).options(joinedload(models.Booking.user))
    if start:
        q = q.filter(models.Booking.end_date > start)
    if end:
        q = q.filter(models.Booking.start_date < end)
    return q.order_by(models.Booking.start_date).all()


@router.post("", response_model=schemas.BookingOut)
def create_booking(
    data: schemas.BookingIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if data.start_date >= data.end_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if data.kind not in ("internal", "external"):
        raise HTTPException(status_code=400, detail="Invalid kind")
    if _overlap_query(db, data.start_date, data.end_date).first():
        raise HTTPException(status_code=409, detail="Booking overlaps an existing one")
    b = models.Booking(user_id=user.id, **data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.patch("/{booking_id}", response_model=schemas.BookingOut)
def update_booking(
    booking_id: int,
    data: schemas.BookingIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    b = db.get(models.Booking, booking_id)
    if not b:
        raise HTTPException(status_code=404)
    if not _can_modify(b, user):
        raise HTTPException(status_code=403, detail="Only the creator can modify internal bookings")
    if data.start_date >= data.end_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if _overlap_query(db, data.start_date, data.end_date, exclude_id=b.id).first():
        raise HTTPException(status_code=409, detail="Booking overlaps an existing one")
    b.start_date = data.start_date
    b.end_date = data.end_date
    b.kind = data.kind
    b.note = data.note
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    b = db.get(models.Booking, booking_id)
    if not b:
        raise HTTPException(status_code=404)
    if not _can_modify(b, user):
        raise HTTPException(status_code=403, detail="Only the creator can delete internal bookings")
    db.delete(b)
    db.commit()
    return {"ok": True}
