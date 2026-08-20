from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin

from app.models.admin import Admin
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
# PUBLIC - EMPLOYEES DO NOT NEED AUTHENTICATION
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
    # Verify room exists and is active
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
    # Get site
    # --------------------------------------------------------

    site = (
        db.query(Site)
        .filter(
            Site.site_id == room.site_id
        )
        .first()
    )

    return {
        "room_reservation_id":
            new_request.room_reservation_id,

        "request_date_time":
            new_request.request_date_time,

        "room_id":
            new_request.room_id,

        "employee_name":
            new_request.employee_name,

        "employee_email":
            new_request.employee_email,

        "reservation_date":
            new_request.reservation_date,

        "start_time":
            new_request.start_time,

        "end_time":
            new_request.end_time,

        "duration_minutes":
            new_request.duration_minutes,

        "purpose":
            new_request.purpose,

        "status":
            new_request.status,

        "admin_remarks":
            new_request.admin_remarks,

        "approved_rejected_by":
            new_request.approved_rejected_by,

        "approved_rejected_date_time":
            new_request.approved_rejected_date_time,

        "calendar_event_id":
            new_request.calendar_event_id,

        "created_at":
            new_request.created_at,

        "updated_at":
            new_request.updated_at,

        "room":
            room.room_name,

        "site":
            site.site_name if site else "",
    }


# ============================================================
# GET ROOM REQUESTS
# ADMIN ONLY
#
# Admin only receives requests belonging to their site.
# ============================================================

@router.get(
    "",
    response_model=list[RoomRequestResponse],
)
def get_room_requests(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
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
        .filter(
            Site.site_name == current_admin.site
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

            "room":
                room_name,

            "site":
                site_name,
        })

    return response

# ============================================================
# GET APPROVED ROOM BOOKINGS
# PUBLIC - EMPLOYEE CALENDAR
#
# Only approved room reservations are returned.
# No admin authentication required.
# ============================================================

@router.get(
    "/approved",
    response_model=list[RoomRequestResponse],
)
def get_approved_room_bookings(
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
        .filter(
            RoomRequest.status == "APPROVED"
        )
        .order_by(
            RoomRequest.reservation_date.asc(),
            RoomRequest.start_time.asc(),
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

            "room":
                room_name,

            "site":
                site_name,
        })

    return response
# ============================================================
# UPDATE ROOM REQUEST STATUS
# ADMIN ONLY
#
# An admin can ONLY approve/reject requests belonging
# to their assigned site.
# ============================================================

@router.patch(
    "/{request_id}",
    response_model=RoomRequestResponse,
)
def update_room_request_status(
    request_id: int,
    status_update: RoomRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # Find request + room + site
    # --------------------------------------------------------

    result = (
        db.query(
            RoomRequest,
            Room,
            Site,
        )
        .join(
            Room,
            Room.room_id == RoomRequest.room_id,
        )
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .filter(
            RoomRequest.room_reservation_id == request_id
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Room request not found.",
        )

    room_request, room, site = result

    # --------------------------------------------------------
    # RBAC CHECK
    #
    # The admin can only modify requests for their site.
    # --------------------------------------------------------

    if site.site_name != current_admin.site:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage requests for this site.",
        )

    # --------------------------------------------------------
    # Validate status
    # --------------------------------------------------------

    new_status = status_update.status.upper()

    allowed_statuses = {
        "PENDING",
        "APPROVED",
        "REJECTED",
    }

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status.",
        )

    # --------------------------------------------------------
    # Optional: prevent changing an already finalized request
    # --------------------------------------------------------

    if room_request.status in {
        "APPROVED",
        "REJECTED",
    }:
        raise HTTPException(
            status_code=400,
            detail="This room request has already been finalized.",
        )

    # --------------------------------------------------------
    # Rejection requires remarks
    # --------------------------------------------------------

    if (
        new_status == "REJECTED"
        and not status_update.admin_remarks
    ):
        raise HTTPException(
            status_code=400,
            detail="Remarks are required when rejecting a request.",
        )

    now = datetime.now()

# --------------------------------------------------------
# APPROVE REQUEST + REJECT OVERLAPPING REQUESTS
# --------------------------------------------------------

    if new_status == "APPROVED":

        # Find all other pending requests for:
        # - the same room
        # - the same reservation date
        #
        # Time overlap rule:
        # existing.start_time < approved.end_time
        # AND
        # existing.end_time > approved.start_time

        conflicting_requests = (
            db.query(RoomRequest)
            .filter(
                RoomRequest.room_reservation_id != request_id,
                RoomRequest.room_id == room_request.room_id,
                RoomRequest.reservation_date
                    == room_request.reservation_date,
                RoomRequest.status == "PENDING",

                RoomRequest.start_time
                    < room_request.end_time,

                RoomRequest.end_time
                    > room_request.start_time,
            )
            .all()
        )

        # Approve the request selected by the admin
        room_request.status = "APPROVED"

        room_request.admin_remarks = (
            status_update.admin_remarks
        )

        room_request.updated_at = now

        room_request.approved_rejected_date_time = now
        room_request.approved_rejected_by = current_admin.id

        # Automatically reject overlapping requests
        for conflict in conflicting_requests:

            conflict.status = "REJECTED"

            conflict.admin_remarks = (
                f"Automatically rejected because "
                f"the room was approved for another "
                f"reservation from "
                f"{room_request.start_time.strftime('%H:%M')} "
                f"to "
                f"{room_request.end_time.strftime('%H:%M')}."
            )

            conflict.approved_rejected_date_time = now
            conflict.approved_rejected_by = current_admin.id
            conflict.updated_at = now


    else:

        # ----------------------------------------------------
        # NORMAL REJECTION / PENDING UPDATE
        # ----------------------------------------------------

        room_request.status = new_status

        room_request.admin_remarks = (
            status_update.admin_remarks
        )

        room_request.updated_at = now

        if new_status == "REJECTED":
            room_request.approved_rejected_date_time = now
            room_request.approved_rejected_by = current_admin.id

        else:
            room_request.approved_rejected_date_time = None
            room_request.approved_rejected_by = None

    db.commit()
    db.refresh(room_request)

    # --------------------------------------------------------
    # Return updated request
    # --------------------------------------------------------

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
            site.site_name,
    }