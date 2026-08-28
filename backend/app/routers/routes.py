from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.room import Room
from app.models.site import Site


router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


# ============================================================
# SCHEMAS
# ============================================================

class RoomCreate(BaseModel):
    room_code: str
    room_name: str
    capacity: int
    location: str | None = None
    site_id: int


class RoomStatusUpdate(BaseModel):
    is_active: bool


# ============================================================
# GET ROOMS
# ADMIN ONLY
#
# If site_id is supplied, only rooms from that site are
# returned.
#
# The frontend currently uses:
# GET /api/rooms?site_id={admin.site_id}
# ============================================================

@router.get("")
def get_rooms(
    site_id: int | None = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # Find the admin's assigned site
    # --------------------------------------------------------

    admin_site = (
        db.query(Site)
        .filter(
            Site.site_name == current_admin.site,
            Site.is_active == True,
        )
        .first()
    )

    if not admin_site:
        raise HTTPException(
            status_code=403,
            detail="Your admin account does not have a valid site assigned.",
        )

    # --------------------------------------------------------
    # Prevent admin from accessing another site's rooms
    # --------------------------------------------------------

    if site_id is not None and site_id != admin_site.site_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access rooms from this site.",
        )

    # --------------------------------------------------------
    # Only return rooms belonging to admin's site
    # --------------------------------------------------------

    rooms = (
        db.query(Room)
        .filter(
            Room.site_id == admin_site.site_id,
        )
        .order_by(
            Room.room_id.desc()
        )
        .all()
    )

    return rooms


# ============================================================
# CREATE ROOM
# ADMIN ONLY
# ============================================================

@router.post("")
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # Validate room code
    # --------------------------------------------------------

    room_code = room_data.room_code.strip()

    if not room_code:
        raise HTTPException(
            status_code=400,
            detail="Room code is required.",
        )

    # --------------------------------------------------------
    # Validate room name
    # --------------------------------------------------------

    room_name = room_data.room_name.strip()

    if not room_name:
        raise HTTPException(
            status_code=400,
            detail="Room name is required.",
        )

    # --------------------------------------------------------
    # Validate capacity
    # --------------------------------------------------------

    if room_data.capacity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be greater than 0.",
        )

    # --------------------------------------------------------
    # Find admin's assigned site
    # --------------------------------------------------------

    admin_site = (
        db.query(Site)
        .filter(
            Site.site_name == current_admin.site,
            Site.is_active == True,
        )
        .first()
    )

    if not admin_site:
        raise HTTPException(
            status_code=403,
            detail="Your admin account does not have a valid site assigned.",
        )

    # --------------------------------------------------------
    # Make sure submitted site belongs to admin
    # --------------------------------------------------------

    if room_data.site_id != admin_site.site_id:
        raise HTTPException(
            status_code=403,
            detail="You can only create rooms for your assigned site.",
        )

    # --------------------------------------------------------
    # Check duplicate room code
    # --------------------------------------------------------

    existing_room = (
        db.query(Room)
        .filter(
            Room.room_code == room_code
        )
        .first()
    )

    if existing_room:
        raise HTTPException(
            status_code=409,
            detail="A room with this room code already exists.",
        )

    # --------------------------------------------------------
    # Create room
    # --------------------------------------------------------

    now = datetime.now()

    new_room = Room(
        room_code=room_code,
        room_name=room_name,
        capacity=room_data.capacity,
        location=(
            room_data.location.strip()
            if room_data.location
            else None
        ),
        is_active=True,
        site_id=admin_site.site_id,
        created_at=now,
        updated_at=now,
    )

    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    return new_room


# ============================================================
# UPDATE ROOM STATUS
# ADMIN ONLY
#
# PATCH /api/rooms/{room_id}/status
# ============================================================

@router.patch("/{room_id}/status")
def update_room_status(
    room_id: int,
    status_data: RoomStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # Find admin's assigned site
    # --------------------------------------------------------

    admin_site = (
        db.query(Site)
        .filter(
            Site.site_name == current_admin.site,
            Site.is_active == True,
        )
        .first()
    )

    if not admin_site:
        raise HTTPException(
            status_code=403,
            detail="Your admin account does not have a valid site assigned.",
        )

    # --------------------------------------------------------
    # Find room
    # --------------------------------------------------------

    room = (
        db.query(Room)
        .filter(
            Room.room_id == room_id,
            Room.site_id == admin_site.site_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found.",
        )

    # --------------------------------------------------------
    # Update status
    # --------------------------------------------------------

    room.is_active = status_data.is_active
    room.updated_at = datetime.now()

    db.commit()
    db.refresh(room)

    return room