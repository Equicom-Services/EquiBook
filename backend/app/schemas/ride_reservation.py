from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class RideReservationCreate(BaseModel):

    employee_name: str = Field(
        ...,
        max_length=150,
    )

    employee_email: str = Field(
        ...,
        max_length=150,
    )

    site_id: int

    travel_date: date

    departure_time: time

    roundtrip: bool = False

    return_pickup: datetime | None = None

    pickup_location: str = Field(
        ...,
        max_length=500,
    )

    pickup_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    dropoff_destination: str = Field(
        ...,
        max_length=500,
    )

    drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    return_drop_off_location: str | None = Field(
        default=None,
        max_length=500,
    )

    return_drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    purpose: str = Field(
        ...,
        max_length=500,
    )

    passenger_count: int = Field(
        ...,
        gt=0,
    )


class RideReservationCancel(BaseModel):
    """Reason an admin gives when cancelling a reservation."""

    admin_remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


class RideReservationStatusUpdate(BaseModel):

    status: str

    admin_remarks: str | None = Field(
        default=None,
        max_length=1000,
    )

    vehicle_type: str | None = Field(
        default=None,
        max_length=100,
    )


class RideReservationResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    approved_rejected_by_name: str | None = None

    ride_reservation_id: int

    request_date_time: datetime

    employee_name: str

    employee_email: str

    site_id: int

    site: str

    travel_date: date

    departure_time: time

    roundtrip: bool

    return_pickup: datetime | None

    pickup_location: str

    pickup_maps_link: str | None

    dropoff_destination: str

    drop_off_maps_link: str | None

    return_drop_off_location: str | None

    return_drop_off_maps_link: str | None

    purpose: str

    passenger_count: int

    vehicle_type: str | None

    status: str

    admin_remarks: str | None

    approved_rejected_by: int | None

    approved_rejected_date_time: datetime | None

    calendar_event_id: str | None

    created_at: datetime

    updated_at: datetime

class AdminRideReservationCreate(BaseModel):
    employee_name: str = Field(..., max_length=150)
    employee_email: str = Field(..., max_length=150)

    travel_date: date
    departure_time: time

    roundtrip: bool = False

    return_pickup: time | None = None

    pickup_location: str = Field(..., max_length=500)

    pickup_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    dropoff_destination: str = Field(
        ...,
        max_length=500,
    )

    drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    return_drop_off_location: str | None = Field(
        default=None,
        max_length=500,
    )

    return_drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    purpose: str = Field(..., max_length=500)

    passenger_count: int = Field(..., gt=0)

    vehicle_type: str = Field(..., max_length=100)

    admin_remarks: str | None = Field(
        default=None,
        max_length=1000,
    )

    employee_name: str = Field(
        ...,
        max_length=150,
    )

    employee_email: str = Field(
        ...,
        max_length=150,
    )

    travel_date: date

    departure_time: time

    roundtrip: bool = False

    return_pickup: datetime | None = None

    pickup_location: str = Field(
        ...,
        max_length=500,
    )

    pickup_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    dropoff_destination: str = Field(
        ...,
        max_length=500,
    )

    drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    return_drop_off_location: str | None = Field(
        default=None,
        max_length=500,
    )

    return_drop_off_maps_link: str | None = Field(
        default=None,
        max_length=1000,
    )

    purpose: str = Field(
        ...,
        max_length=500,
    )

    passenger_count: int = Field(
        ...,
        gt=0,
    )

    vehicle_type: str = Field(
        ...,
        max_length=100,
    )

    admin_remarks: str | None = Field(
        default=None,
        max_length=1000,
    )