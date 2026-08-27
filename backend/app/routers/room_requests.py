from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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
    RoomBookingUpdate,
)

from app.services.email_service import send_email
from app.services.email_templates import (
    booking_submitted_email,
    booking_status_email,
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
    background_tasks: BackgroundTasks,
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

        # --------------------------------------------------------
    # Notify admins belonging to this site
    # --------------------------------------------------------

    admins = (
        db.query(Admin)
        .filter(
            Admin.site == site.site_name
        )
        .all()
    )

    admin_emails = [
        admin.email
        for admin in admins
        if admin.email
    ]

    if admin_emails:

        html_body = booking_submitted_email(
            employee_name=new_request.employee_name,
            employee_email=new_request.employee_email,
            room=room.room_name,
            site=site.site_name if site else "",
            reservation_date=new_request.reservation_date,
            start_time=new_request.start_time,
            end_time=new_request.end_time,
            purpose=new_request.purpose,
        )

        background_tasks.add_task(
            send_email,
            admin_emails,
            "New Room Booking Request",
            html_body,
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
            Admin.name.label("approved_rejected_by_name"),
            Admin.email.label("approved_rejected_by_email"),
        )
        .join(
            Room,
            Room.room_id == RoomRequest.room_id,
        )
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .outerjoin(
            Admin,
            Admin.id == RoomRequest.approved_rejected_by,
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

    for (
        room_request,
        room_name,
        site_name,
        approved_rejected_by_name,
        approved_rejected_by_email,
    ) in results:

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

            "approved_rejected_by_name":
                approved_rejected_by_name,

            "approved_rejected_by_email":
                approved_rejected_by_email,

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
# ADMIN - CALENDAR
#
# Only approved reservations from the logged-in
# admin's assigned site are returned.
# ============================================================

@router.get(
    "/approved",
    response_model=list[RoomRequestResponse],
)
def get_approved_room_bookings(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
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
            RoomRequest.status == "APPROVED",
            Site.site_name == current_admin.site,
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
# GET ACTIVE ROOM BOOKINGS
# PUBLIC - EMPLOYEE CALENDAR
#
# Returns APPROVED and PENDING room reservations.
# REJECTED requests are excluded.
# No admin authentication required.
# ============================================================

@router.get(
    "/active",
    response_model=list[RoomRequestResponse],
)
def get_active_room_bookings(
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
            RoomRequest.status.in_([
                "APPROVED",
                "PENDING",
            ])
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

@router.post(
    "/admin/room-bookings",
    response_model=RoomRequestResponse,
)
def create_admin_room_booking(
    booking: RoomRequestCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # ---------------------------------------------------------
    # 1. Find room and verify it belongs to admin's site
    # ---------------------------------------------------------

    room = (
        db.query(Room)
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .filter(
            Room.room_id == booking.room_id,
            Room.is_active == True,
            Site.is_active == True,
            Site.site_name == current_admin.site,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=403,
            detail="You can only book rooms within your assigned site.",
        )

    # ---------------------------------------------------------
    # 2. Validate requester information
    # ---------------------------------------------------------

    if not booking.employee_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester name is required.",
        )

    if not booking.employee_email.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester email is required.",
        )

    # ---------------------------------------------------------
    # 3. Validate time
    # ---------------------------------------------------------

    if booking.start_time >= booking.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )

    # ---------------------------------------------------------
    # 4. Calculate duration
    # ---------------------------------------------------------

    start_minutes = (
        booking.start_time.hour * 60
        + booking.start_time.minute
    )

    end_minutes = (
        booking.end_time.hour * 60
        + booking.end_time.minute
    )

    duration_minutes = end_minutes - start_minutes

    if duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid reservation duration.",
        )

    # ---------------------------------------------------------
    # 5. Check for overlapping APPROVED booking
    # ---------------------------------------------------------

    overlapping_booking = (
        db.query(RoomRequest)
        .filter(
            RoomRequest.room_id == booking.room_id,

            RoomRequest.reservation_date
            == booking.reservation_date,

            RoomRequest.status == "APPROVED",

            RoomRequest.start_time < booking.end_time,

            RoomRequest.end_time > booking.start_time,
        )
        .first()
    )

    if overlapping_booking:
        raise HTTPException(
            status_code=409,
            detail=(
                "This room is already booked during the selected "
                "date and time."
            ),
        )

    # ---------------------------------------------------------
    # 6. Create booking
    # ---------------------------------------------------------

    now = datetime.now()

    room_request = RoomRequest(
        request_date_time=now,

        room_id=booking.room_id,

        # IMPORTANT:
        # These are the person who requested the booking,
        # NOT the admin who is entering it.
        employee_name=booking.employee_name.strip(),
        employee_email=booking.employee_email.strip(),

        reservation_date=booking.reservation_date,

        start_time=booking.start_time,
        end_time=booking.end_time,

        duration_minutes=duration_minutes,

        purpose=booking.purpose,

        # Admin-created bookings are automatically approved
        status="APPROVED",

        # This records WHICH ADMIN created/approved it
        approved_rejected_by=current_admin.id,
        approved_rejected_date_time=now,

        admin_remarks=None,
        calendar_event_id=None,

        created_at=now,
        updated_at=now,
    )

    # ---------------------------------------------------------
    # 7. Save
    # ---------------------------------------------------------

    db.add(room_request)
    db.commit()
    db.refresh(room_request)

    # ---------------------------------------------------------
    # 8. Get site
    # ---------------------------------------------------------

    site = (
        db.query(Site)
        .filter(
            Site.site_id == room.site_id
        )
        .first()
    )

    # ---------------------------------------------------------
    # 9. Return booking
    # ---------------------------------------------------------

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
            site.site_name if site else None,
    }


# ============================================================
# UPDATE ADMIN ROOM BOOKING
# ADMIN ONLY
#
# Allows an admin to modify an existing booking belonging
# to their assigned site.
# ============================================================

@router.put(
    "/admin/room-bookings/{request_id}",
    response_model=RoomRequestResponse,
)
def update_admin_room_booking(
    request_id: int,
    booking: RoomBookingUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # ---------------------------------------------------------
    # 1. Find booking + room + site
    # ---------------------------------------------------------

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
            RoomRequest.room_reservation_id == request_id,
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Room booking not found.",
        )

    room_request, old_room, old_site = result

    # ---------------------------------------------------------
    # 2. Verify admin owns this booking's site
    # ---------------------------------------------------------

    if old_site.site_name != current_admin.site:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to modify this booking.",
        )

    # ---------------------------------------------------------
    # 3. Find new room
    # ---------------------------------------------------------

    room = (
        db.query(Room)
        .join(
            Site,
            Site.site_id == Room.site_id,
        )
        .filter(
            Room.room_id == booking.room_id,
            Room.is_active == True,
            Site.is_active == True,
            Site.site_name == current_admin.site,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=403,
            detail="You can only use rooms within your assigned site.",
        )

    # ---------------------------------------------------------
    # 4. Validate requester
    # ---------------------------------------------------------

    if not booking.employee_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester name is required.",
        )

    if not booking.employee_email.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester email is required.",
        )

    # ---------------------------------------------------------
    # 5. Validate time
    # ---------------------------------------------------------

    if booking.start_time >= booking.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )

    # ---------------------------------------------------------
    # 6. Calculate duration
    # ---------------------------------------------------------

    start_minutes = (
        booking.start_time.hour * 60
        + booking.start_time.minute
    )

    end_minutes = (
        booking.end_time.hour * 60
        + booking.end_time.minute
    )

    duration_minutes = end_minutes - start_minutes

    if duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid reservation duration.",
        )

    # ---------------------------------------------------------
    # 7. Check overlapping APPROVED bookings
    #
    # Exclude the booking currently being edited.
    # ---------------------------------------------------------

    overlapping_booking = (
        db.query(RoomRequest)
        .filter(
            RoomRequest.room_reservation_id != request_id,

            RoomRequest.room_id == booking.room_id,

            RoomRequest.reservation_date
            == booking.reservation_date,

            RoomRequest.status == "APPROVED",

            RoomRequest.start_time < booking.end_time,

            RoomRequest.end_time > booking.start_time,
        )
        .first()
    )

    if overlapping_booking:
        raise HTTPException(
            status_code=409,
            detail=(
                "This room is already booked during the "
                "selected date and time."
            ),
        )

    # ---------------------------------------------------------
    # 8. Update booking
    # ---------------------------------------------------------

    now = datetime.now()

    room_request.room_id = booking.room_id

    room_request.employee_name = (
        booking.employee_name.strip()
    )

    room_request.employee_email = (
        booking.employee_email.strip()
    )

    room_request.reservation_date = (
        booking.reservation_date
    )

    room_request.start_time = booking.start_time

    room_request.end_time = booking.end_time

    room_request.duration_minutes = duration_minutes

    room_request.purpose = booking.purpose

    room_request.updated_at = now

    # Keep it approved because this is an admin edit
    room_request.status = "APPROVED"

    # Record the admin who modified it
    room_request.approved_rejected_by = current_admin.id
    room_request.approved_rejected_date_time = now

    db.commit()
    db.refresh(room_request)

    # ---------------------------------------------------------
    # 9. Return updated booking
    # ---------------------------------------------------------

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
            site.site_name if site else None,
    }


# ============================================================
# CANCEL ADMIN ROOM BOOKING
# ADMIN ONLY
# ============================================================

@router.patch(
    "/admin/room-bookings/{request_id}/cancel",
    response_model=RoomRequestResponse,
)
def cancel_admin_room_booking(
    request_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
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
            RoomRequest.room_reservation_id == request_id,
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Room booking not found.",
        )

    room_request, room, site = result

    # ---------------------------------------------------------
    # Verify admin site
    # ---------------------------------------------------------

    if site.site_name != current_admin.site:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to cancel this booking.",
        )

    # ---------------------------------------------------------
    # Prevent duplicate cancellation
    # ---------------------------------------------------------

    if room_request.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="This booking is already cancelled.",
        )

    # ---------------------------------------------------------
    # Cancel booking
    # ---------------------------------------------------------

    now = datetime.now()

    room_request.status = "CANCELLED"

    room_request.admin_remarks = (
        f"Booking cancelled by admin {current_admin.email}."
    )

    room_request.approved_rejected_by = current_admin.id
    room_request.approved_rejected_date_time = now
    room_request.updated_at = now

    db.commit()
    db.refresh(room_request)

    # ---------------------------------------------------------
    # Email requester
    # ---------------------------------------------------------

    html_body = booking_status_email(
        employee_name=room_request.employee_name,
        status="cancelled",
        room=room.room_name,
        site=site.site_name,
        reservation_date=room_request.reservation_date,
        start_time=room_request.start_time,
        end_time=room_request.end_time,
        purpose=room_request.purpose,
        remarks=room_request.admin_remarks,
    )

    background_tasks.add_task(
        send_email,
        [room_request.employee_email],
        "Room Booking Cancelled",
        html_body,
    )

    return {
        "room_reservation_id": room_request.room_reservation_id,
        "request_date_time": room_request.request_date_time,
        "room_id": room_request.room_id,
        "employee_name": room_request.employee_name,
        "employee_email": room_request.employee_email,
        "reservation_date": room_request.reservation_date,
        "start_time": room_request.start_time,
        "end_time": room_request.end_time,
        "duration_minutes": room_request.duration_minutes,
        "purpose": room_request.purpose,
        "status": room_request.status,
        "admin_remarks": room_request.admin_remarks,
        "approved_rejected_by": room_request.approved_rejected_by,
        "approved_rejected_date_time":
            room_request.approved_rejected_date_time,
        "calendar_event_id": room_request.calendar_event_id,
        "created_at": room_request.created_at,
        "updated_at": room_request.updated_at,
        "room": room.room_name,
        "site": site.site_name,
    }


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
    background_tasks: BackgroundTasks,
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
    # Prevent changing an already finalized request
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

        # ---------------------------------------------------------
        # Notify employee whose pending request was automatically
        # rejected
        # ---------------------------------------------------------

        conflict_html = booking_status_email(
            employee_name=conflict.employee_name,
            status="rejected",
            room=room.room_name,
            site=site.site_name,
            reservation_date=conflict.reservation_date,
            start_time=conflict.start_time,
            end_time=conflict.end_time,
            purpose=conflict.purpose,
            remarks=conflict.admin_remarks,
        )

        background_tasks.add_task(
            send_email,
            [conflict.employee_email],
            "Room Booking Rejected",
            conflict_html,
        )


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
    # Send approval email to employee
    # --------------------------------------------------------

    if room_request.status == "APPROVED":

        html_body = booking_status_email(
            employee_name=room_request.employee_name,
            status="approved",
            room=room.room_name,
            site=site.site_name,
            reservation_date=room_request.reservation_date,
            start_time=room_request.start_time,
            end_time=room_request.end_time,
            purpose=room_request.purpose,
            remarks=room_request.admin_remarks,
        )

        background_tasks.add_task(
            send_email,
            [room_request.employee_email],
            "Room Booking Approved",
            html_body,
        )

    # --------------------------------------------------------
    # Send rejection email to employee
    # --------------------------------------------------------

    elif room_request.status == "REJECTED":

        html_body = booking_status_email(
            employee_name=room_request.employee_name,
            status="rejected",
            room=room.room_name,
            site=site.site_name,
            reservation_date=room_request.reservation_date,
            start_time=room_request.start_time,
            end_time=room_request.end_time,
            purpose=room_request.purpose,
            remarks=room_request.admin_remarks,
        )

        background_tasks.add_task(
            send_email,
            [room_request.employee_email],
            "Room Booking Rejected",
            html_body,
        )

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