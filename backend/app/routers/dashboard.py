from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room_request import RoomRequest

router = APIRouter()


@router.get("/dashboard/room-stats")
def get_room_stats(
    db: Session = Depends(get_db),
):
    total = db.query(RoomRequest).count()

    approved = (
        db.query(RoomRequest)
        .filter(func.upper(RoomRequest.status) == "APPROVED")
        .count()
    )

    rejected = (
        db.query(RoomRequest)
        .filter(func.upper(RoomRequest.status) == "REJECTED")
        .count()
    )

    pending = (
        db.query(RoomRequest)
        .filter(func.upper(RoomRequest.status) == "PENDING")
        .count()
    )

    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
    }