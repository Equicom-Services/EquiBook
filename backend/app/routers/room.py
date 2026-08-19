from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room import Room

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


@router.get("")
def get_rooms(
    site_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Room)
        .filter(Room.is_active == True)
    )

    if site_id is not None:
        query = query.filter(Room.site_id == site_id)

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