"""
Employee self-service for existing bookings (cancel / edit).

Employees don't log in and booking IDs are sequential, so knowing an
ID proves nothing. Before a booking can be changed, a one-time code is
emailed to the address the booking was made with; entering it returns
a short-lived token scoped to that single booking. Every endpoint here
is public, and none of the mutating ones trust a booking ID without
that token.

The token carries ``scope: booking_access`` and no ``sub``, so it is
rejected by ``get_current_admin``; admin tokens lack the scope and are
rejected here.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.admin import Admin
from app.models.booking_access_code import BookingAccessCode
from app.models.ride_reservation import RideReservation
from app.models.room import Room
from app.models.room_request import RoomRequest
from app.models.site import Site
from app.schemas.booking_access import (
    BookingAccessCancel,
    BookingCodeRequest,
    BookingCodeVerify,
)
from app.schemas.ride_reservation import RideReservationCreate
from app.schemas.room_request import RoomRequestCreate
from app.services.booking_access_emails import (
    requester_action_admin_email,
    verification_code_email,
)
from app.services.email_service import send_email
from app.services.email_templates import (
    booking_status_email,
    ride_booking_status_email,
    ride_booking_submitted_email,
)


router = APIRouter(
    prefix="/booking-access",
    tags=["Booking Access"],
)


CODE_TTL_MINUTES = 10
CODE_RESEND_SECONDS = 60
MAX_CODE_ATTEMPTS = 5
TOKEN_TTL_MINUTES = 30
TOKEN_SCOPE = "booking_access"

# Only bookings in these states can still be cancelled or edited.
OPEN_STATUSES = {"PENDING", "APPROVED"}

bearer = HTTPBearer(auto_error=False)


# ============================================================
# HELPERS
# ============================================================

def _label(booking_type: str) -> str:
    return (
        "room booking"
        if booking_type == "room"
        else "ride reservation"
    )


def _hash_code(
    booking_type: str,
    booking_id: int,
    code: str,
) -> str:
    message = f"{booking_type}:{booking_id}:{code}".encode()

    return hmac.new(
        settings.SECRET_KEY.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")

    visible = local[:2] if len(local) > 2 else local[:1]

    return f"{visible}***@{domain}" if domain else f"{visible}***"


def _format_date(value) -> str:
    return value.strftime("%B %d, %Y")


def _format_time(value) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def _load_booking(
    db: Session,
    booking_type: str,
    booking_id: int,
):
    if booking_type == "room":
        booking = (
            db.query(RoomRequest)
            .filter(RoomRequest.room_reservation_id == booking_id)
            .first()
        )
    else:
        booking = (
            db.query(RideReservation)
            .filter(RideReservation.ride_reservation_id == booking_id)
            .first()
        )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail=(
                f"We couldn't find a {_label(booking_type)} "
                f"with Booking ID #{booking_id}."
            ),
        )

    return booking


def _starts_at(booking_type: str, booking) -> datetime:
    if booking_type == "room":
        return datetime.combine(
            booking.reservation_date,
            booking.start_time,
        )

    return datetime.combine(
        booking.travel_date,
        booking.departure_time,
    )


def _ensure_changeable(booking_type: str, booking) -> None:
    status = (booking.status or "").upper()

    if status not in OPEN_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=(
                f"This booking is already {status.lower()}, "
                "so it can no longer be changed."
            ),
        )

    if _starts_at(booking_type, booking) <= datetime.now():
        raise HTTPException(
            status_code=409,
            detail=(
                "This booking has already started or taken place, "
                "so it can no longer be changed."
            ),
        )


def _site_admin_emails(
    db: Session,
    site_names: set[str],
) -> list[str]:
    admins = (
        db.query(Admin)
        .filter(Admin.site.in_(site_names))
        .all()
    )

    return sorted({
        admin.email
        for admin in admins
        if admin.email
    })


def _room_context(db: Session, booking: RoomRequest):
    room = (
        db.query(Room)
        .filter(Room.room_id == booking.room_id)
        .first()
    )

    site = (
        db.query(Site)
        .filter(Site.site_id == room.site_id)
        .first()
        if room
        else None
    )

    return room, site


def _ride_site(db: Session, booking: RideReservation):
    """
    Rides store the site name; ``site_id`` is often NULL because the
    create endpoint never filled it in.
    """
    if booking.site_id:
        site = (
            db.query(Site)
            .filter(Site.site_id == booking.site_id)
            .first()
        )

        if site:
            return site

    return (
        db.query(Site)
        .filter(Site.site_name == booking.site)
        .first()
    )


# Same shape as the public create endpoint returns, so the booking
# forms can be pre-filled from it.
def _room_booking_dict(booking: RoomRequest, room, site) -> dict:
    return {
        "room_reservation_id": booking.room_reservation_id,
        "request_date_time": booking.request_date_time,
        "room_id": booking.room_id,
        "employee_name": booking.employee_name,
        "employee_email": booking.employee_email,
        "reservation_date": booking.reservation_date,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "duration_minutes": booking.duration_minutes,
        "purpose": booking.purpose,
        "status": booking.status,
        "admin_remarks": booking.admin_remarks,
        "approved_rejected_by": booking.approved_rejected_by,
        "approved_rejected_date_time": (
            booking.approved_rejected_date_time
        ),
        "calendar_event_id": booking.calendar_event_id,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
        "room": room.room_name if room else "",
        "site": site.site_name if site else "",
        "site_id": site.site_id if site else None,
    }


def _ride_booking_dict(booking: RideReservation, site) -> dict:
    return {
        "ride_reservation_id": booking.ride_reservation_id,
        "request_date_time": booking.request_date_time,
        "employee_name": booking.employee_name,
        "employee_email": booking.employee_email,
        "site_id": site.site_id if site else booking.site_id,
        "site": booking.site,
        "travel_date": booking.travel_date,
        "departure_time": booking.departure_time,
        "roundtrip": booking.roundtrip,
        "return_pickup": booking.return_pickup,
        "pickup_location": booking.pickup_location,
        "pickup_maps_link": booking.pickup_maps_link,
        "dropoff_destination": booking.dropoff_destination,
        "drop_off_maps_link": booking.drop_off_maps_link,
        "return_drop_off_location": booking.return_drop_off_location,
        "return_drop_off_maps_link": booking.return_drop_off_maps_link,
        "purpose": booking.purpose,
        "passenger_count": booking.passenger_count,
        "vehicle_type": booking.vehicle_type,
        "status": booking.status,
        "admin_remarks": booking.admin_remarks,
        "approved_rejected_by": booking.approved_rejected_by,
        "approved_rejected_date_time": (
            booking.approved_rejected_date_time
        ),
        "calendar_event_id": booking.calendar_event_id,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
    }


def _booking_payload(
    db: Session,
    booking_type: str,
    booking,
) -> dict:
    if booking_type == "room":
        room, site = _room_context(db, booking)
        return _room_booking_dict(booking, room, site)

    return _ride_booking_dict(booking, _ride_site(db, booking))


def _room_rows(booking: RoomRequest, room, site) -> list[tuple[str, str]]:
    return [
        ("Requester", booking.employee_name),
        ("Email", booking.employee_email),
        ("Room", room.room_name if room else ""),
        ("Site", site.site_name if site else ""),
        ("Date", _format_date(booking.reservation_date)),
        (
            "Time",
            f"{_format_time(booking.start_time)} - "
            f"{_format_time(booking.end_time)}",
        ),
        ("Purpose", booking.purpose),
    ]


def _ride_rows(booking: RideReservation) -> list[tuple[str, str]]:
    return [
        ("Requester", booking.employee_name),
        ("Email", booking.employee_email),
        ("Site", booking.site),
        ("Travel Date", _format_date(booking.travel_date)),
        ("Departure", _format_time(booking.departure_time)),
        ("Pickup", booking.pickup_location),
        ("Drop-off", booking.dropoff_destination),
        ("Round Trip", "Yes" if booking.roundtrip else "No"),
        ("Passengers", str(booking.passenger_count)),
        ("Purpose", booking.purpose),
    ]


def _ride_status_email(
    booking: RideReservation,
    status: str,
    remarks: str | None,
    acted_by: str | None,
) -> str:
    return ride_booking_status_email(
        booking_id=booking.ride_reservation_id,
        employee_name=booking.employee_name,
        employee_email=booking.employee_email,
        site=booking.site,
        travel_date=booking.travel_date,
        departure_time=booking.departure_time,
        roundtrip=booking.roundtrip,
        return_pickup=booking.return_pickup,
        pickup_location=booking.pickup_location,
        pickup_maps_link=booking.pickup_maps_link,
        dropoff_destination=booking.dropoff_destination,
        drop_off_maps_link=booking.drop_off_maps_link,
        return_drop_off_location=booking.return_drop_off_location,
        return_drop_off_maps_link=booking.return_drop_off_maps_link,
        purpose=booking.purpose,
        passenger_count=booking.passenger_count,
        vehicle_type=booking.vehicle_type,
        status=status,
        admin_remarks=remarks,
        admin_name=acted_by,
    )


def _issue_token(booking_type: str, booking_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_TTL_MINUTES
    )

    return jwt.encode(
        {
            "scope": TOKEN_SCOPE,
            "booking_type": booking_type,
            "booking_id": booking_id,
            "exp": expire,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def get_booking_access(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    expired = HTTPException(
        status_code=401,
        detail="Your verification has expired. Please start again.",
    )

    if credentials is None:
        raise expired

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
    except JWTError:
        raise expired

    if (
        payload.get("scope") != TOKEN_SCOPE
        or payload.get("booking_type") not in ("room", "ride")
        or not isinstance(payload.get("booking_id"), int)
    ):
        raise expired

    return payload


def _require_type(access: dict, booking_type: str) -> int:
    if access["booking_type"] != booking_type:
        raise HTTPException(
            status_code=403,
            detail=(
                "This verification is for a different booking. "
                "Please start again."
            ),
        )

    return access["booking_id"]


# ============================================================
# REQUEST A VERIFICATION CODE
# PUBLIC
# ============================================================

@router.post("/request-code")
def request_code(
    body: BookingCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    booking = _load_booking(db, body.booking_type, body.booking_id)

    _ensure_changeable(body.booking_type, booking)

    now = datetime.now()

    latest = (
        db.query(BookingAccessCode)
        .filter(
            BookingAccessCode.booking_type == body.booking_type,
            BookingAccessCode.booking_id == body.booking_id,
        )
        .order_by(BookingAccessCode.created_at.desc())
        .first()
    )

    if (
        latest
        and (now - latest.created_at).total_seconds()
        < CODE_RESEND_SECONDS
    ):
        raise HTTPException(
            status_code=429,
            detail=(
                "A code was sent less than a minute ago. Please check "
                "your email, or wait a moment before requesting another."
            ),
        )

    # Retire older codes so only the newest one works.
    (
        db.query(BookingAccessCode)
        .filter(
            BookingAccessCode.booking_type == body.booking_type,
            BookingAccessCode.booking_id == body.booking_id,
            BookingAccessCode.used_at.is_(None),
        )
        .update(
            {"used_at": now},
            synchronize_session=False,
        )
    )

    code = f"{secrets.randbelow(1_000_000):06d}"

    db.add(
        BookingAccessCode(
            booking_type=body.booking_type,
            booking_id=body.booking_id,
            code_hash=_hash_code(
                body.booking_type,
                body.booking_id,
                code,
            ),
            attempts=0,
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
            used_at=None,
            created_at=now,
        )
    )

    db.commit()

    background_tasks.add_task(
        send_email,
        [booking.employee_email],
        f"Your Equibook verification code (Booking ID #{body.booking_id})",
        verification_code_email(
            employee_name=booking.employee_name,
            booking_label=_label(body.booking_type),
            booking_id=body.booking_id,
            code=code,
            action=body.action,
            expires_minutes=CODE_TTL_MINUTES,
        ),
    )

    return {
        "message": "Verification code sent.",
        "email_hint": _mask_email(booking.employee_email),
        "expires_in_minutes": CODE_TTL_MINUTES,
    }


# ============================================================
# VERIFY THE CODE
# PUBLIC - returns a token scoped to this one booking
# ============================================================

@router.post("/verify")
def verify_code(
    body: BookingCodeVerify,
    db: Session = Depends(get_db),
):
    booking = _load_booking(db, body.booking_type, body.booking_id)

    now = datetime.now()

    record = (
        db.query(BookingAccessCode)
        .filter(
            BookingAccessCode.booking_type == body.booking_type,
            BookingAccessCode.booking_id == body.booking_id,
            BookingAccessCode.used_at.is_(None),
        )
        .order_by(BookingAccessCode.created_at.desc())
        .first()
    )

    if record is None or record.expires_at <= now:
        raise HTTPException(
            status_code=400,
            detail="This code has expired. Please request a new one.",
        )

    too_many = HTTPException(
        status_code=429,
        detail="Too many incorrect attempts. Please request a new code.",
    )

    if record.attempts >= MAX_CODE_ATTEMPTS:
        raise too_many

    expected = _hash_code(
        body.booking_type,
        body.booking_id,
        body.code.strip(),
    )

    if not hmac.compare_digest(record.code_hash, expected):
        record.attempts += 1
        db.commit()

        remaining = MAX_CODE_ATTEMPTS - record.attempts

        if remaining <= 0:
            raise too_many

        raise HTTPException(
            status_code=400,
            detail=(
                f"That code is incorrect. {remaining} "
                f"attempt{'s' if remaining != 1 else ''} left."
            ),
        )

    record.used_at = now
    db.commit()

    _ensure_changeable(body.booking_type, booking)

    return {
        "access_token": _issue_token(
            body.booking_type,
            body.booking_id,
        ),
        "expires_in_minutes": TOKEN_TTL_MINUTES,
        "booking_type": body.booking_type,
        "booking": _booking_payload(db, body.booking_type, booking),
    }


# ============================================================
# CANCEL
# Requires the booking-access token
# ============================================================

@router.post("/cancel")
def cancel_booking(
    body: BookingAccessCancel,
    background_tasks: BackgroundTasks,
    access: dict = Depends(get_booking_access),
    db: Session = Depends(get_db),
):
    booking_type = access["booking_type"]
    booking_id = access["booking_id"]

    booking = _load_booking(db, booking_type, booking_id)

    _ensure_changeable(booking_type, booking)

    reason = body.reason.strip()

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="Please give a reason for cancelling.",
        )

    now = datetime.now()

    booking.status = "CANCELLED"
    booking.admin_remarks = f"Cancelled by requester: {reason}"
    booking.approved_rejected_by = None
    booking.approved_rejected_date_time = now
    booking.updated_at = now

    db.commit()
    db.refresh(booking)

    if booking_type == "room":
        room, site = _room_context(db, booking)

        requester_html = booking_status_email(
            booking_id=booking_id,
            employee_name=booking.employee_name,
            status="cancelled",
            room=room.room_name if room else "",
            site=site.site_name if site else "",
            reservation_date=booking.reservation_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            purpose=booking.purpose,
            remarks=reason,
            admin_name=booking.employee_name,
        )

        requester_subject = f"Room Booking Cancelled (Booking ID #{booking_id})"
        admin_subject = (
            f"Room Booking Cancelled by Requester (Booking ID #{booking_id})"
        )
        rows = _room_rows(booking, room, site)
        site_names = {site.site_name} if site else set()
        eyebrow = "Room Reservation"

    else:
        requester_html = _ride_status_email(
            booking,
            status="CANCELLED",
            remarks=reason,
            acted_by=booking.employee_name,
        )

        requester_subject = (
            f"Ride Reservation Cancelled (Booking ID #{booking_id})"
        )
        admin_subject = (
            f"Ride Reservation Cancelled by Requester "
            f"(Booking ID #{booking_id})"
        )
        rows = _ride_rows(booking)
        site_names = {booking.site}
        eyebrow = "Ride Reservation"

    background_tasks.add_task(
        send_email,
        [booking.employee_email],
        requester_subject,
        requester_html,
    )

    admin_emails = _site_admin_emails(db, site_names)

    if admin_emails:
        background_tasks.add_task(
            send_email,
            admin_emails,
            admin_subject,
            requester_action_admin_email(
                eyebrow=eyebrow,
                title="Cancelled by Requester",
                intro=(
                    f"{booking.employee_name} cancelled their "
                    f"{_label(booking_type)}. No action is needed."
                ),
                booking_id=booking_id,
                rows=rows + [("Reason", reason)],
            ),
        )

    return {
        "message": f"Booking #{booking_id} has been cancelled.",
        "booking": _booking_payload(db, booking_type, booking),
    }


# ============================================================
# EDIT ROOM BOOKING
# Requires the booking-access token. Goes back to PENDING.
# ============================================================

@router.put("/room")
def edit_room_booking(
    body: RoomRequestCreate,
    background_tasks: BackgroundTasks,
    access: dict = Depends(get_booking_access),
    db: Session = Depends(get_db),
):
    booking_id = _require_type(access, "room")

    booking = _load_booking(db, "room", booking_id)

    _ensure_changeable("room", booking)

    room = (
        db.query(Room)
        .filter(
            Room.room_id == body.room_id,
            Room.is_active == True,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Selected room not found.",
        )

    duration = (
        (body.end_time.hour * 60 + body.end_time.minute)
        - (body.start_time.hour * 60 + body.start_time.minute)
    )

    if duration <= 0:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )

    if datetime.combine(body.reservation_date, body.start_time) <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="The new date and time must be in the future.",
        )

    old_room, old_site = _room_context(db, booking)

    was_approved = booking.status.upper() == "APPROVED"

    previous = (
        f"{old_room.room_name if old_room else ''}, "
        f"{_format_date(booking.reservation_date)}, "
        f"{_format_time(booking.start_time)} - "
        f"{_format_time(booking.end_time)}"
    )

    now = datetime.now()

    # Name and email stay as booked: they are who the code was sent to.
    booking.room_id = body.room_id
    booking.reservation_date = body.reservation_date
    booking.start_time = body.start_time
    booking.end_time = body.end_time
    booking.duration_minutes = duration
    booking.purpose = body.purpose

    booking.status = "PENDING"
    booking.admin_remarks = None
    booking.approved_rejected_by = None
    booking.approved_rejected_date_time = None
    booking.updated_at = now

    db.commit()
    db.refresh(booking)

    room, site = _room_context(db, booking)

    background_tasks.add_task(
        send_email,
        [booking.employee_email],
        f"Room Booking Changes Received (Booking ID #{booking_id})",
        booking_status_email(
            booking_id=booking_id,
            employee_name=booking.employee_name,
            status="pending",
            room=room.room_name if room else "",
            site=site.site_name if site else "",
            reservation_date=booking.reservation_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            purpose=booking.purpose,
        ),
    )

    site_names = {
        s.site_name
        for s in (site, old_site)
        if s
    }

    admin_emails = _site_admin_emails(db, site_names)

    if admin_emails:
        background_tasks.add_task(
            send_email,
            admin_emails,
            (
                f"Room Booking Changed by Requester - Review Required "
                f"(Booking ID #{booking_id})"
            ),
            requester_action_admin_email(
                eyebrow="Room Reservation",
                title="Changed by Requester",
                intro=(
                    f"{booking.employee_name} changed their room booking. "
                    "It is pending again and needs your review."
                ),
                booking_id=booking_id,
                rows=_room_rows(booking, room, site) + [
                    ("Previously", previous),
                ],
                note=(
                    "This booking was approved before the change. "
                    "The earlier slot is no longer reserved."
                    if was_approved
                    else None
                ),
            ),
        )

    return {
        "message": (
            f"Booking #{booking_id} was updated and is "
            "pending approval again."
        ),
        "booking": _room_booking_dict(booking, room, site),
    }


# ============================================================
# EDIT RIDE RESERVATION
# Requires the booking-access token. Goes back to PENDING.
# ============================================================

@router.put("/ride")
def edit_ride_booking(
    body: RideReservationCreate,
    background_tasks: BackgroundTasks,
    access: dict = Depends(get_booking_access),
    db: Session = Depends(get_db),
):
    booking_id = _require_type(access, "ride")

    booking = _load_booking(db, "ride", booking_id)

    _ensure_changeable("ride", booking)

    site = (
        db.query(Site)
        .filter(
            Site.site_id == body.site_id,
            Site.is_active == True,
        )
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Selected site not found.",
        )

    if body.passenger_count <= 0:
        raise HTTPException(
            status_code=400,
            detail="Passenger count must be greater than 0.",
        )

    if body.roundtrip and not body.return_pickup:
        raise HTTPException(
            status_code=400,
            detail=(
                "Return pickup is required "
                "for round-trip reservations."
            ),
        )

    if datetime.combine(body.travel_date, body.departure_time) <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="The new date and time must be in the future.",
        )

    old_site_name = booking.site
    was_approved = booking.status.upper() == "APPROVED"

    previous = (
        f"{_format_date(booking.travel_date)}, "
        f"{_format_time(booking.departure_time)}, "
        f"{booking.pickup_location} to {booking.dropoff_destination}"
    )

    now = datetime.now()

    # Name and email stay as booked: they are who the code was sent to.
    booking.site = site.site_name
    booking.site_id = site.site_id
    booking.travel_date = body.travel_date
    booking.departure_time = body.departure_time
    booking.roundtrip = body.roundtrip
    booking.pickup_location = body.pickup_location
    booking.pickup_maps_link = body.pickup_maps_link
    booking.dropoff_destination = body.dropoff_destination
    booking.drop_off_maps_link = body.drop_off_maps_link

    if body.roundtrip:
        booking.return_pickup = body.return_pickup
        booking.return_drop_off_location = body.return_drop_off_location
        booking.return_drop_off_maps_link = body.return_drop_off_maps_link
    else:
        booking.return_pickup = None
        booking.return_drop_off_location = None
        booking.return_drop_off_maps_link = None

    booking.purpose = body.purpose
    booking.passenger_count = body.passenger_count

    # The admin assigns transport again when re-approving.
    booking.vehicle_type = None
    booking.status = "PENDING"
    booking.admin_remarks = None
    booking.approved_rejected_by = None
    booking.approved_rejected_date_time = None
    booking.updated_at = now

    db.commit()
    db.refresh(booking)

    background_tasks.add_task(
        send_email,
        [booking.employee_email],
        f"Ride Reservation Changes Received (Booking ID #{booking_id})",
        ride_booking_submitted_email(
            booking_id=booking_id,
            employee_name=booking.employee_name,
            employee_email=booking.employee_email,
            site=booking.site,
            travel_date=booking.travel_date,
            departure_time=booking.departure_time,
            roundtrip=booking.roundtrip,
            return_pickup=booking.return_pickup,
            pickup_location=booking.pickup_location,
            pickup_maps_link=booking.pickup_maps_link,
            dropoff_destination=booking.dropoff_destination,
            drop_off_maps_link=booking.drop_off_maps_link,
            return_drop_off_location=booking.return_drop_off_location,
            return_drop_off_maps_link=booking.return_drop_off_maps_link,
            purpose=booking.purpose,
            passenger_count=booking.passenger_count,
        ),
    )

    admin_emails = _site_admin_emails(
        db,
        {site.site_name, old_site_name},
    )

    if admin_emails:
        background_tasks.add_task(
            send_email,
            admin_emails,
            (
                f"Ride Reservation Changed by Requester - Review Required "
                f"(Booking ID #{booking_id})"
            ),
            requester_action_admin_email(
                eyebrow="Ride Reservation",
                title="Changed by Requester",
                intro=(
                    f"{booking.employee_name} changed their ride "
                    "reservation. It is pending again and needs your review."
                ),
                booking_id=booking_id,
                rows=_ride_rows(booking) + [
                    ("Previously", previous),
                ],
                note=(
                    "This reservation was approved before the change. "
                    "Transportation needs to be assigned again."
                    if was_approved
                    else None
                ),
            ),
        )

    return {
        "message": (
            f"Booking #{booking_id} was updated and is "
            "pending approval again."
        ),
        "booking": _ride_booking_dict(booking, site),
    }
