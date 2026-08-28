from datetime import datetime

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
)

from app.services.email_service import send_email
from app.services.email_templates import (
    ride_booking_submitted_email,
    ride_booking_admin_email,
    ride_booking_status_email,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.ride_reservation import RideReservation
from app.models.site import Site
from app.schemas.ride_reservation import (
    RideReservationCreate,
    RideReservationResponse,
    RideReservationStatusUpdate,
    AdminRideReservationCreate,
)


router = APIRouter(
    prefix="/ride-reservations",
    tags=["Ride Reservations"],
)


@router.post(
    "",
    response_model=RideReservationResponse,
)
def create_ride_reservation(
    request: RideReservationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # 1. Verify site exists and is active
    # ---------------------------------------------------------
    site = (
        db.query(Site)
        .filter(
            Site.site_id == request.site_id,
            Site.is_active == True,
        )
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Selected site not found.",
        )

    # ---------------------------------------------------------
    # 2. Validate requester
    # ---------------------------------------------------------
    if not request.employee_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester name is required.",
        )

    if not request.employee_email.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester email is required.",
        )

    # ---------------------------------------------------------
    # 3. Validate passenger count
    # ---------------------------------------------------------
    if request.passenger_count <= 0:
        raise HTTPException(
            status_code=400,
            detail="Passenger count must be greater than 0.",
        )

    # ---------------------------------------------------------
    # 4. Validate round trip
    # ---------------------------------------------------------
    if request.roundtrip and not request.return_pickup:
        raise HTTPException(
            status_code=400,
            detail=(
                "Return pickup is required "
                "for round-trip reservations."
            ),
        )

    # ---------------------------------------------------------
    # 5. Create reservation
    # ---------------------------------------------------------
    now = datetime.now()

    new_reservation = RideReservation(
        request_date_time=now,
        employee_name=request.employee_name.strip(),
        employee_email=request.employee_email.strip(),

        # Database column is `site`, not `site_id`
        site=site.site_name,
        site_id=current_admin.site,
        travel_date=request.travel_date,
        departure_time=request.departure_time,
        roundtrip=request.roundtrip,
        return_pickup=request.return_pickup,
        pickup_location=request.pickup_location.strip(),
        pickup_maps_link=request.pickup_maps_link,
        dropoff_destination=request.dropoff_destination.strip(),
        drop_off_maps_link=request.drop_off_maps_link,
        return_drop_off_location=request.return_drop_off_location,
        return_drop_off_maps_link=request.return_drop_off_maps_link,
        purpose=request.purpose.strip(),
        passenger_count=request.passenger_count,
        vehicle_type=None,
        status="PENDING",
        admin_remarks=None,
        approved_rejected_by=None,
        approved_rejected_date_time=None,
        calendar_event_id=None,
        created_at=now,
        updated_at=now,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    # ---------------------------------------------------------
    # 6. Find admins assigned to this site
    # ---------------------------------------------------------
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

# ---------------------------------------------------------
# 7. Email notifications
# ---------------------------------------------------------

    # Email requester
    requester_email_body = ride_booking_submitted_email(
        employee_name=new_reservation.employee_name,
        employee_email=new_reservation.employee_email,
        site=new_reservation.site,
        travel_date=new_reservation.travel_date,
        departure_time=new_reservation.departure_time,
        roundtrip=new_reservation.roundtrip,
        return_pickup=new_reservation.return_pickup,
        pickup_location=new_reservation.pickup_location,
        pickup_maps_link=new_reservation.pickup_maps_link,
        dropoff_destination=new_reservation.dropoff_destination,
        drop_off_maps_link=new_reservation.drop_off_maps_link,
        return_drop_off_location=(
            new_reservation.return_drop_off_location
        ),
        return_drop_off_maps_link=(
            new_reservation.return_drop_off_maps_link
        ),
        purpose=new_reservation.purpose,
        passenger_count=new_reservation.passenger_count,
    )

    background_tasks.add_task(
        send_email,
        [new_reservation.employee_email],
        "Ride Reservation Submitted",
        requester_email_body,
    )


    # Email admins assigned to this site
    if admin_emails:

        admin_email_body = ride_booking_admin_email(
            employee_name=new_reservation.employee_name,
            employee_email=new_reservation.employee_email,
            site=new_reservation.site,
            travel_date=new_reservation.travel_date,
            departure_time=new_reservation.departure_time,
            roundtrip=new_reservation.roundtrip,
            return_pickup=new_reservation.return_pickup,
            pickup_location=new_reservation.pickup_location,
            pickup_maps_link=new_reservation.pickup_maps_link,
            dropoff_destination=new_reservation.dropoff_destination,
            drop_off_maps_link=new_reservation.drop_off_maps_link,
            return_drop_off_location=(
                new_reservation.return_drop_off_location
            ),
            return_drop_off_maps_link=(
                new_reservation.return_drop_off_maps_link
            ),
            purpose=new_reservation.purpose,
            passenger_count=new_reservation.passenger_count,
        )

        background_tasks.add_task(
            send_email,
            admin_emails,
            "New Ride Reservation Request",
            admin_email_body,
        )

    # ---------------------------------------------------------
    # 8. Return
    # ---------------------------------------------------------
    return {
        "ride_reservation_id": new_reservation.ride_reservation_id,
        "request_date_time": new_reservation.request_date_time,
        "employee_name": new_reservation.employee_name,
        "employee_email": new_reservation.employee_email,

        # API still returns site_id
        "site_id": request.site_id,
        "site": new_reservation.site,

        "travel_date": new_reservation.travel_date,
        "departure_time": new_reservation.departure_time,
        "roundtrip": new_reservation.roundtrip,
        "return_pickup": new_reservation.return_pickup,
        "pickup_location": new_reservation.pickup_location,
        "pickup_maps_link": new_reservation.pickup_maps_link,
        "dropoff_destination": new_reservation.dropoff_destination,
        "drop_off_maps_link": new_reservation.drop_off_maps_link,
        "return_drop_off_location": (
            new_reservation.return_drop_off_location
        ),
        "return_drop_off_maps_link": (
            new_reservation.return_drop_off_maps_link
        ),
        "purpose": new_reservation.purpose,
        "passenger_count": new_reservation.passenger_count,
        "vehicle_type": new_reservation.vehicle_type,
        "status": new_reservation.status,
        "admin_remarks": new_reservation.admin_remarks,
        "approved_rejected_by": (
            new_reservation.approved_rejected_by
        ),
        "approved_rejected_date_time": (
            new_reservation.approved_rejected_date_time
        ),
        "calendar_event_id": new_reservation.calendar_event_id,
        "created_at": new_reservation.created_at,
        "updated_at": new_reservation.updated_at,
    }

@router.get(
    "",
    response_model=list[RideReservationResponse],
)
def get_ride_reservations(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):

    results = (
        db.query(
            RideReservation,
            Site.site_id,
            Site.site_name,
            Admin.name,
        )
        .join(
            Site,
            Site.site_name == RideReservation.site,
        )
        .outerjoin(
            Admin,
            Admin.id == RideReservation.approved_rejected_by,
        )
        .filter(
            RideReservation.site == current_admin.site,
        )
        .order_by(
            RideReservation.request_date_time.desc()
        )
        .all()
    )

    response = []

    for reservation, site_id, site_name, admin_name in results:

        response.append({
            "ride_reservation_id":
                reservation.ride_reservation_id,

            "request_date_time":
                reservation.request_date_time,

            "employee_name":
                reservation.employee_name,

            "employee_email":
                reservation.employee_email,

            "site_id":
                site_id,

            "site":
                site_name,

            "travel_date":
                reservation.travel_date,

            "departure_time":
                reservation.departure_time,

            "roundtrip":
                reservation.roundtrip,

            "return_pickup":
                reservation.return_pickup,

            "pickup_location":
                reservation.pickup_location,

            "pickup_maps_link":
                reservation.pickup_maps_link,

            "dropoff_destination":
                reservation.dropoff_destination,

            "drop_off_maps_link":
                reservation.drop_off_maps_link,

            "return_drop_off_location":
                reservation.return_drop_off_location,

            "return_drop_off_maps_link":
                reservation.return_drop_off_maps_link,

            "purpose":
                reservation.purpose,

            "passenger_count":
                reservation.passenger_count,

            "vehicle_type":
                reservation.vehicle_type,

            "status":
                reservation.status,

            "admin_remarks":
                reservation.admin_remarks,

            "approved_rejected_by":
                reservation.approved_rejected_by,

            "approved_rejected_by_name":
                admin_name,

            "approved_rejected_date_time":
                reservation.approved_rejected_date_time,

            "calendar_event_id":
                reservation.calendar_event_id,

            "created_at":
                reservation.created_at,

            "updated_at":
                reservation.updated_at,
        })

    return response


# APPROVE ENDPOINT 


@router.put(
    "/{ride_reservation_id}/status",
    response_model=RideReservationResponse,
)
def update_ride_reservation_status(
    ride_reservation_id: int,
    request: RideReservationStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    reservation = (
        db.query(RideReservation)
        .filter(
            RideReservation.ride_reservation_id == ride_reservation_id,
            RideReservation.site == current_admin.site,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Ride reservation not found.",
        )

    new_status = request.status.upper()

    if new_status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be APPROVED or REJECTED.",
        )

    if reservation.status.upper() != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only pending ride reservations can be approved or rejected.",
        )

    if new_status == "APPROVED" and not request.vehicle_type:
        raise HTTPException(
            status_code=400,
            detail="Vehicle type is required when approving a ride reservation.",
        )

    now = datetime.now()

    reservation.status = new_status
    reservation.admin_remarks = request.admin_remarks
    reservation.approved_rejected_by = current_admin.id
    reservation.approved_rejected_date_time = now
    reservation.updated_at = now

    if new_status == "APPROVED":
        reservation.vehicle_type = request.vehicle_type
    else:
        reservation.vehicle_type = None

    db.commit()
    db.refresh(reservation)
    # ---------------------------------------------------------
# Send status email to requester
# ---------------------------------------------------------

    email_body = ride_booking_status_email(
        employee_name=reservation.employee_name,
        employee_email=reservation.employee_email,
        site=reservation.site,
        travel_date=reservation.travel_date,
        departure_time=reservation.departure_time,
        roundtrip=reservation.roundtrip,
        return_pickup=reservation.return_pickup,
        pickup_location=reservation.pickup_location,
        pickup_maps_link=reservation.pickup_maps_link,
        dropoff_destination=reservation.dropoff_destination,
        drop_off_maps_link=reservation.drop_off_maps_link,
        return_drop_off_location=(
            reservation.return_drop_off_location
        ),
        return_drop_off_maps_link=(
            reservation.return_drop_off_maps_link
        ),
        purpose=reservation.purpose,
        passenger_count=reservation.passenger_count,
        vehicle_type=reservation.vehicle_type,
        status=reservation.status,
        admin_remarks=reservation.admin_remarks,
        admin_name=current_admin.name,
    )

    background_tasks.add_task(
        send_email,
        [reservation.employee_email],
        f"Ride Reservation {reservation.status.capitalize()}",
        email_body,
    )

    site = (
        db.query(Site)
        .filter(Site.site_name == reservation.site)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Reservation site not found.",
        )

    return {
        "ride_reservation_id": reservation.ride_reservation_id,
        "request_date_time": reservation.request_date_time,
        "employee_name": reservation.employee_name,
        "employee_email": reservation.employee_email,
        "site_id": site.site_id,
        "site": site.site_name,
        "travel_date": reservation.travel_date,
        "departure_time": reservation.departure_time,
        "roundtrip": reservation.roundtrip,
        "return_pickup": reservation.return_pickup,
        "pickup_location": reservation.pickup_location,
        "pickup_maps_link": reservation.pickup_maps_link,
        "dropoff_destination": reservation.dropoff_destination,
        "drop_off_maps_link": reservation.drop_off_maps_link,
        "return_drop_off_location":
            reservation.return_drop_off_location,
        "return_drop_off_maps_link":
            reservation.return_drop_off_maps_link,
        "purpose": reservation.purpose,
        "passenger_count": reservation.passenger_count,
        "vehicle_type": reservation.vehicle_type,
        "status": reservation.status,
        "admin_remarks": reservation.admin_remarks,

        "approved_rejected_by":
            reservation.approved_rejected_by,

        "approved_rejected_by_name":
            current_admin.name,

        "approved_rejected_date_time":
            reservation.approved_rejected_date_time,

        "calendar_event_id":
            reservation.calendar_event_id,

        "created_at":
            reservation.created_at,

        "updated_at":
            reservation.updated_at,
    }

@router.delete("/{ride_reservation_id}")
def delete_ride_reservation(
    ride_reservation_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    reservation = (
        db.query(RideReservation)
        .filter(
            RideReservation.ride_reservation_id == ride_reservation_id,
            RideReservation.site == current_admin.site,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Ride reservation not found.",
        )

    db.delete(reservation)
    db.commit()

    return {
        "message": "Ride reservation deleted successfully."
    }

@router.put(
    "/{ride_reservation_id}/cancel",
    response_model=RideReservationResponse,
)
def cancel_ride_reservation(
    ride_reservation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    reservation = (
        db.query(RideReservation)
        .filter(
            RideReservation.ride_reservation_id == ride_reservation_id,
            RideReservation.site == current_admin.site,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Ride reservation not found.",
        )

    if reservation.status.upper() != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Only approved ride reservations can be cancelled.",
        )

    now = datetime.now()

    reservation.status = "CANCELLED"
    reservation.admin_remarks = "Ride reservation cancelled."
    reservation.approved_rejected_by = current_admin.id
    reservation.approved_rejected_date_time = now
    reservation.updated_at = now

    db.commit()
    db.refresh(reservation)
    # ---------------------------------------------------------
# Send cancellation email to requester
# ---------------------------------------------------------

    email_body = ride_booking_status_email(
        employee_name=reservation.employee_name,
        employee_email=reservation.employee_email,
        site=reservation.site,
        travel_date=reservation.travel_date,
        departure_time=reservation.departure_time,
        roundtrip=reservation.roundtrip,
        return_pickup=reservation.return_pickup,
        pickup_location=reservation.pickup_location,
        pickup_maps_link=reservation.pickup_maps_link,
        dropoff_destination=reservation.dropoff_destination,
        drop_off_maps_link=reservation.drop_off_maps_link,
        return_drop_off_location=(
            reservation.return_drop_off_location
        ),
        return_drop_off_maps_link=(
            reservation.return_drop_off_maps_link
        ),
        purpose=reservation.purpose,
        passenger_count=reservation.passenger_count,
        vehicle_type=reservation.vehicle_type,
        status=reservation.status,
        admin_remarks=reservation.admin_remarks,
        admin_name=current_admin.name,
    )

    background_tasks.add_task(
        send_email,
        [reservation.employee_email],
        "Ride Reservation Cancelled",
        email_body,
    )

    site = (
        db.query(Site)
        .filter(Site.site_name == reservation.site)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Reservation site not found.",
        )

    return {
        "ride_reservation_id": reservation.ride_reservation_id,
        "request_date_time": reservation.request_date_time,
        "employee_name": reservation.employee_name,
        "employee_email": reservation.employee_email,
        "site_id": site.site_id,
        "site": site.site_name,
        "travel_date": reservation.travel_date,
        "departure_time": reservation.departure_time,
        "roundtrip": reservation.roundtrip,
        "return_pickup": reservation.return_pickup,
        "pickup_location": reservation.pickup_location,
        "pickup_maps_link": reservation.pickup_maps_link,
        "dropoff_destination": reservation.dropoff_destination,
        "drop_off_maps_link": reservation.drop_off_maps_link,
        "return_drop_off_location": reservation.return_drop_off_location,
        "return_drop_off_maps_link": reservation.return_drop_off_maps_link,
        "purpose": reservation.purpose,
        "passenger_count": reservation.passenger_count,
        "vehicle_type": reservation.vehicle_type,
        "status": reservation.status,
        "admin_remarks": reservation.admin_remarks,
        "approved_rejected_by": reservation.approved_rejected_by,
        "approved_rejected_date_time": reservation.approved_rejected_date_time,
        "calendar_event_id": reservation.calendar_event_id,
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at,
    }

@router.get(
    "/approved",
    response_model=list[RideReservationResponse],
)
def get_approved_ride_reservations(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    results = (
        db.query(
            RideReservation,
            Site.site_id,
            Admin.name,
        )
        .join(
            Site,
            Site.site_name == RideReservation.site,
        )
        .outerjoin(
            Admin,
            Admin.id == RideReservation.approved_rejected_by,
        )
        .filter(
            RideReservation.status == "APPROVED",
            RideReservation.site == current_admin.site,
        )
        .order_by(
            RideReservation.travel_date.asc(),
            RideReservation.departure_time.asc(),
        )
        .all()
    )

    response = []

    for reservation, site_id, admin_name in results:
        response.append({
            "ride_reservation_id": reservation.ride_reservation_id,
            "request_date_time": reservation.request_date_time,
            "employee_name": reservation.employee_name,
            "employee_email": reservation.employee_email,
            "site_id": site_id,
            "site": reservation.site,
            "travel_date": reservation.travel_date,
            "departure_time": reservation.departure_time,
            "roundtrip": reservation.roundtrip,
            "return_pickup": reservation.return_pickup,
            "pickup_location": reservation.pickup_location,
            "pickup_maps_link": reservation.pickup_maps_link,
            "dropoff_destination": reservation.dropoff_destination,
            "drop_off_maps_link": reservation.drop_off_maps_link,
            "return_drop_off_location": reservation.return_drop_off_location,
            "return_drop_off_maps_link": reservation.return_drop_off_maps_link,
            "purpose": reservation.purpose,
            "passenger_count": reservation.passenger_count,
            "vehicle_type": reservation.vehicle_type,
            "status": reservation.status,
            "admin_remarks": reservation.admin_remarks,
            "approved_rejected_by": reservation.approved_rejected_by,
            "approved_rejected_date_time": reservation.approved_rejected_date_time,
            "calendar_event_id": reservation.calendar_event_id,
            "created_at": reservation.created_at,
            "updated_at": reservation.updated_at,
            "admin_name": admin_name,
        })

    return response

@router.get(
    "/active",
    response_model=list[RideReservationResponse],
)
def get_active_ride_reservations(
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            RideReservation,
            Site.site_id,
        )
        .join(
            Site,
            Site.site_name == RideReservation.site,
        )
        .filter(
            RideReservation.status.in_([
                "APPROVED",
                "PENDING",
            ])
        )
        .order_by(
            RideReservation.travel_date.asc(),
            RideReservation.departure_time.asc(),
        )
        .all()
    )

    response = []

    for reservation, site_id in results:
        response.append({
            "ride_reservation_id":
                reservation.ride_reservation_id,

            "request_date_time":
                reservation.request_date_time,

            "employee_name":
                reservation.employee_name,

            "employee_email":
                reservation.employee_email,

            "site_id":
                site_id,

            "site":
                reservation.site,

            "travel_date":
                reservation.travel_date,

            "departure_time":
                reservation.departure_time,

            "roundtrip":
                reservation.roundtrip,

            "return_pickup":
                reservation.return_pickup,

            "pickup_location":
                reservation.pickup_location,

            "pickup_maps_link":
                reservation.pickup_maps_link,

            "dropoff_destination":
                reservation.dropoff_destination,

            "drop_off_maps_link":
                reservation.drop_off_maps_link,

            "return_drop_off_location":
                reservation.return_drop_off_location,

            "return_drop_off_maps_link":
                reservation.return_drop_off_maps_link,

            "purpose":
                reservation.purpose,

            "passenger_count":
                reservation.passenger_count,

            "vehicle_type":
                reservation.vehicle_type,

            "status":
                reservation.status,

            "admin_remarks":
                reservation.admin_remarks,

            "approved_rejected_by":
                reservation.approved_rejected_by,

            "approved_rejected_date_time":
                reservation.approved_rejected_date_time,

            "calendar_event_id":
                reservation.calendar_event_id,

            "created_at":
                reservation.created_at,

            "updated_at":
                reservation.updated_at,
        })

    return response

# ADMIN MANUAL ROOM BOOKINGS


@router.post(
    "/admin/bookings",
    response_model=RideReservationResponse,
)
def create_admin_ride_booking(
    request: AdminRideReservationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    now = datetime.now()

    # Validate requester
    if not request.employee_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester name is required.",
        )

    if not request.employee_email.strip():
        raise HTTPException(
            status_code=400,
            detail="Requester email is required.",
        )

    # Validate passenger count
    if request.passenger_count <= 0:
        raise HTTPException(
            status_code=400,
            detail="Passenger count must be greater than 0.",
        )

    # Validate round trip
    if request.roundtrip and not request.return_pickup:
        raise HTTPException(
            status_code=400,
            detail="Return pickup is required for round-trip reservations.",
        )

    # Vehicle should be required because admin is booking directly
    if not request.vehicle_type:
        raise HTTPException(
            status_code=400,
            detail="Vehicle type is required.",
        )

    new_reservation = RideReservation(
        request_date_time=now,

        employee_name=request.employee_name.strip(),
        employee_email=request.employee_email.strip(),

        # Force admin's assigned site
        site=current_admin.site,

        travel_date=request.travel_date,
        departure_time=request.departure_time,

        roundtrip=request.roundtrip,
        return_pickup=request.return_pickup,

        pickup_location=request.pickup_location.strip(),
        pickup_maps_link=request.pickup_maps_link,

        dropoff_destination=request.dropoff_destination.strip(),
        drop_off_maps_link=request.drop_off_maps_link,

        return_drop_off_location=request.return_drop_off_location,
        return_drop_off_maps_link=request.return_drop_off_maps_link,

        purpose=request.purpose.strip(),

        passenger_count=request.passenger_count,

        # Admin selects this immediately
        vehicle_type=request.vehicle_type,

        # Automatically approved
        status="APPROVED",

        admin_remarks=request.admin_remarks,

        # Record which admin created/approved it
        approved_rejected_by=current_admin.id,
        approved_rejected_date_time=now,

        calendar_event_id=None,

        created_at=now,
        updated_at=now,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    site = (
        db.query(Site)
        .filter(Site.site_name == new_reservation.site)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Reservation site not found.",
        )

    return {
        "ride_reservation_id": new_reservation.ride_reservation_id,
        "request_date_time": new_reservation.request_date_time,
        "employee_name": new_reservation.employee_name,
        "employee_email": new_reservation.employee_email,
        "site_id": site.site_id,
        "site": site.site_name,
        "travel_date": new_reservation.travel_date,
        "departure_time": new_reservation.departure_time,
        "roundtrip": new_reservation.roundtrip,
        "return_pickup": new_reservation.return_pickup,
        "pickup_location": new_reservation.pickup_location,
        "pickup_maps_link": new_reservation.pickup_maps_link,
        "dropoff_destination": new_reservation.dropoff_destination,
        "drop_off_maps_link": new_reservation.drop_off_maps_link,
        "return_drop_off_location": new_reservation.return_drop_off_location,
        "return_drop_off_maps_link": new_reservation.return_drop_off_maps_link,
        "purpose": new_reservation.purpose,
        "passenger_count": new_reservation.passenger_count,
        "vehicle_type": new_reservation.vehicle_type,
        "status": new_reservation.status,
        "admin_remarks": new_reservation.admin_remarks,
        "approved_rejected_by": new_reservation.approved_rejected_by,
        "approved_rejected_by_name": current_admin.name,
        "approved_rejected_date_time": new_reservation.approved_rejected_date_time,
        "calendar_event_id": new_reservation.calendar_event_id,
        "created_at": new_reservation.created_at,
        "updated_at": new_reservation.updated_at,
    }