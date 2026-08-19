from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.room_request import RoomRequest
from app.models.room import Room
from app.models.site import Site

from app.schemas.room_request import (
    RoomRequestCreate,
    RoomRequestResponse,
    RoomRequestStatusUpdate,
)


router = APIRouter(
    prefix="/room-requests",
    tags=["Room Requests"],
)


# ============================================================
# CREATE ROOM REQUEST
# ============================================================

@router.post(
    "",
    response_model=RoomRequestResponse,
)
def create_room_request(
    request: RoomRequestCreate,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Verify room exists
    # --------------------------------------------------------

    room = (
        db.query(Room)
        .filter(
            Room.room_id == request.room_id,
            Room.is_active == True,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Selected room not found.",
        )

    # --------------------------------------------------------
    # Calculate duration
    # --------------------------------------------------------

    start_minutes = (
        request.start_time.hour * 60
        + request.start_time.minute
    )

    end_minutes = (
        request.end_time.hour * 60
        + request.end_time.minute
    )

    duration = end_minutes - start_minutes

    if duration <= 0:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )

    now = datetime.now()

    # --------------------------------------------------------
    # Create request
    # --------------------------------------------------------

    new_request = RoomRequest(
        request_date_time=now,

        room_id=request.room_id,

        employee_name=request.employee_name,
        employee_email=request.employee_email,

        reservation_date=request.reservation_date,

        start_time=request.start_time,
        end_time=request.end_time,

        duration_minutes=duration,

        purpose=request.purpose,

        status="PENDING",

        admin_remarks=None,
        approved_rejected_by=None,
        approved_rejected_date_time=None,

        calendar_event_id=None,

        created_at=now,
        updated_at=now,
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # --------------------------------------------------------
    # Return request together with room + site
    # --------------------------------------------------------

    site = (
        db.query(Site)
        .filter(
            Site.site_id == room.site_id
        )
        .first()
    )

    return {
        "room_reservation_id": new_request.room_reservation_id,
        "request_date_time": new_request.request_date_time,

        "room_id": new_request.room_id,

        "employee_name": new_request.employee_name,
        "employee_email": new_request.employee_email,

        "reservation_date": new_request.reservation_date,
        "start_time": new_request.start_time,
        "end_time": new_request.end_time,

        "duration_minutes": new_request.duration_minutes,

        "purpose": new_request.purpose,
        "status": new_request.status,

        "admin_remarks": new_request.admin_remarks,
        "approved_rejected_by": new_request.approved_rejected_by,
        "approved_rejected_date_time":
            new_request.approved_rejected_date_time,

        "calendar_event_id": new_request.calendar_event_id,

        "created_at": new_request.created_at,
        "updated_at": new_request.updated_at,

        "room": room.room_name,
        "site": site.site_name if site else "",
    }


# ============================================================
# GET ALL ROOM REQUESTS
# ============================================================

@router.get(
    "",
    response_model=list[RoomRequestResponse],
)
def get_room_requests(
    db: Session = Depends(get_db),
):

    results = (
        db.query(
            RoomRequest,
            Room.room_name,
            Site.site_name,
        )
        .join(
            Room,
            Room.room_id == RoomRequest.room_id,
        )
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .order_by(
            RoomRequest.request_date_time.desc()
        )
        .all()
    )

    response = []

    for room_request, room_name, site_name in results:

        response.append({
            "room_reservation_id":
                room_request.room_reservation_id,

            "request_date_time":
                room_request.request_date_time,

            "room_id":
                room_request.room_id,

            "employee_name":
                room_request.employee_name,

            "employee_email":
                room_request.employee_email,

            "reservation_date":
                room_request.reservation_date,

            "start_time":
                room_request.start_time,

            "end_time":
                room_request.end_time,

            "duration_minutes":
                room_request.duration_minutes,

            "purpose":
                room_request.purpose,

            "status":
                room_request.status,

            "admin_remarks":
                room_request.admin_remarks,

            "approved_rejected_by":
                room_request.approved_rejected_by,

            "approved_rejected_date_time":
                room_request.approved_rejected_date_time,

            "calendar_event_id":
                room_request.calendar_event_id,

            "created_at":
                room_request.created_at,

            "updated_at":
                room_request.updated_at,

            # Joined values
            "room":
                room_name,

            "site":
                site_name,
        })

    return response


# ============================================================
# UPDATE ROOM REQUEST STATUS
# ============================================================

@router.patch(
    "/{request_id}",
    response_model=RoomRequestResponse,
)
def update_room_request_status(
    request_id: int,
    status_update: RoomRequestStatusUpdate,
    db: Session = Depends(get_db),
):

    room_request = (
        db.query(RoomRequest)
        .filter(
            RoomRequest.room_reservation_id == request_id
        )
        .first()
    )

    if not room_request:
        raise HTTPException(
            status_code=404,
            detail="Room request not found.",
        )

    allowed_statuses = {
        "PENDING",
        "APPROVED",
        "REJECTED",
    }

    status = status_update.status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status.",
        )

    now = datetime.now()

    room_request.status = status
    room_request.admin_remarks = status_update.admin_remarks
    room_request.updated_at = now

    if status in {"APPROVED", "REJECTED"}:
        room_request.approved_rejected_date_time = now
        room_request.approved_rejected_by = None
    else:
        room_request.approved_rejected_date_time = None
        room_request.approved_rejected_by = None

    db.commit()
    db.refresh(room_request)

    # --------------------------------------------------------
    # Get room + site
    # --------------------------------------------------------

    room = (
        db.query(Room)
        .filter(
            Room.room_id == room_request.room_id
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room associated with request not found.",
        )

    site = (
        db.query(Site)
        .filter(
            Site.site_id == room.site_id
        )
        .first()
    )

    return {
        "room_reservation_id":
            room_request.room_reservation_id,

        "request_date_time":
            room_request.request_date_time,

        "room_id":
            room_request.room_id,

        "employee_name":
            room_request.employee_name,

        "employee_email":
            room_request.employee_email,

        "reservation_date":
            room_request.reservation_date,

        "start_time":
            room_request.start_time,

        "end_time":
            room_request.end_time,

        "duration_minutes":
            room_request.duration_minutes,

        "purpose":
            room_request.purpose,

        "status":
            room_request.status,

        "admin_remarks":
            room_request.admin_remarks,

        "approved_rejected_by":
            room_request.approved_rejected_by,

        "approved_rejected_date_time":
            room_request.approved_rejected_date_time,

        "calendar_event_id":
            room_request.calendar_event_id,

        "created_at":
            room_request.created_at,

        "updated_at":
            room_request.updated_at,

        "room":
            room.room_name,

        "site":
            site.site_name if site else "",
    }