from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RideReservation(Base):
    __tablename__ = "ride_reservation_request"

    ride_reservation_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    request_date_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    employee_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    employee_email: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    site: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    travel_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    departure_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    roundtrip: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    return_pickup: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    pickup_location: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    pickup_maps_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    dropoff_destination: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    drop_off_maps_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    return_drop_off_location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    return_drop_off_maps_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    purpose: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    passenger_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Admin enters this when approving the reservation.
    vehicle_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    admin_remarks: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    approved_rejected_by: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("admin.id"),
        nullable=True,
    )

    approved_rejected_date_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    calendar_event_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )