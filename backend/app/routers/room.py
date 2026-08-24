from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room import Room


router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


# ============================================================
# GET ROOMS
# ============================================================

@router.get("")
def get_rooms(
    site_id: int | None = Query(default=None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    query = db.query(Room)

    if active_only:
        query = query.filter(
            Room.is_active == True
        )

    if site_id is not None:
        query = query.filter(
            Room.site_id == site_id
        )

    rooms = (
        query
        .order_by(Room.room_code)
        .all()
    )

    return [
        {
            "room_id": room.room_id,
            "room_code": room.room_code,
            "room_name": room.room_name,
            "capacity": room.capacity,
            "location": room.location,
            "is_active": room.is_active,
            "site_id": room.site_id,
        }
        for room in rooms
    ]


# ============================================================
# POST CREATE ROOM
# ============================================================

@router.post("")
def create_room(
    room_code: str,
    room_name: str,
    capacity: int,
    site_id: int,
    location: str | None = None,
    db: Session = Depends(get_db),
):
    # Check if room code already exists
    existing_room = (
        db.query(Room)
        .filter(
            Room.room_code == room_code
        )
        .first()
    )

    if existing_room:
        raise HTTPException(
            status_code=400,
            detail="Room code already exists.",
        )

    now = datetime.now()

    new_room = Room(
        room_code=room_code,
        room_name=room_name,
        capacity=capacity,
        location=location,
        site_id=site_id,
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    return {
        "room_id": new_room.room_id,
        "room_code": new_room.room_code,
        "room_name": new_room.room_name,
        "capacity": new_room.capacity,
        "location": new_room.location,
        "is_active": new_room.is_active,
        "site_id": new_room.site_id,
    }


# ============================================================
# PATCH ROOM STATUS
# ============================================================

@router.patch("/{room_id}/status")
def update_room_status(
    room_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
):
    room = (
        db.query(Room)
        .filter(
            Room.room_id == room_id
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found.",
        )

    room.is_active = is_active
    room.updated_at = datetime.now()

    db.commit()
    db.refresh(room)

    return {
        "room_id": room.room_id,
        "room_code": room.room_code,
        "room_name": room.room_name,
        "capacity": room.capacity,
        "location": room.location,
        "is_active": room.is_active,
        "site_id": room.site_id,
    }