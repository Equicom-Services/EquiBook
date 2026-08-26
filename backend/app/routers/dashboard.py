from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.room_request import RoomRequest
from app.models.room import Room
from app.models.site import Site
from app.models.ride_reservation import RideReservation


router = APIRouter()


# ============================================================
# ROOM DASHBOARD STATISTICS
# ============================================================

@router.get("/dashboard/room-stats")
def get_room_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    Return room reservation statistics for the
    currently logged-in admin's assigned site only.
    """

    base_query = (
        db.query(RoomRequest)
        .join(
            Room,
            Room.room_id == RoomRequest.room_id,
        )
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .filter(
            Site.site_name == current_admin.site
        )
    )

    total = base_query.count()

    approved = (
        base_query
        .filter(func.upper(RoomRequest.status) == "APPROVED")
        .count()
    )

    rejected = (
        base_query
        .filter(func.upper(RoomRequest.status) == "REJECTED")
        .count()
    )

    pending = (
        base_query
        .filter(func.upper(RoomRequest.status) == "PENDING")
        .count()
    )

    cancelled = (
        base_query
        .filter(func.upper(RoomRequest.status) == "CANCELLED")
        .count()
    )

    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "cancelled": cancelled,
    }


# ============================================================
# RIDE DASHBOARD STATISTICS
# ============================================================

@router.get("/dashboard/ride-stats")
def get_ride_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    Return ride reservation statistics for the
    currently logged-in admin's assigned site only.
    """

    base_query = (
        db.query(RideReservation)
        .filter(
            RideReservation.site == current_admin.site
        )
    )

    total = base_query.count()

    approved = (
        base_query
        .filter(
            func.upper(RideReservation.status) == "APPROVED"
        )
        .count()
    )

    rejected = (
        base_query
        .filter(
            func.upper(RideReservation.status) == "REJECTED"
        )
        .count()
    )

    pending = (
        base_query
        .filter(
            func.upper(RideReservation.status) == "PENDING"
        )
        .count()
    )

    cancelled = (
        base_query
        .filter(
            func.upper(RideReservation.status) == "CANCELLED"
        )
        .count()
    )

    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "cancelled": cancelled,
    }