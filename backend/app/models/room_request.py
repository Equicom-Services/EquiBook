from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Text,
    Time,
    ForeignKey,
)

from app.core.database import Base


class RoomRequest(Base):
    __tablename__ = "room_reservation_request"

    room_reservation_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    request_date_time = Column(
        DateTime,
        nullable=False,
    )

    room_id = Column(
        BigInteger,
        ForeignKey("rooms.room_id"),
        nullable=False,
    )

    employee_name = Column(
        String(150),
        nullable=False,
    )

    employee_email = Column(
        String(150),
        nullable=False,
    )

    reservation_date = Column(
        Date,
        nullable=False,
    )

    start_time = Column(
        Time,
        nullable=False,
    )

    end_time = Column(
        Time,
        nullable=False,
    )

    duration_minutes = Column(
        Integer,
        nullable=False,
    )

    purpose = Column(
        String(500),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    admin_remarks = Column(
        Text,
        nullable=True,
    )

    approved_rejected_by = Column(
        BigInteger,
        nullable=True,
    )

    approved_rejected_date_time = Column(
        DateTime,
        nullable=True,
    )

    calendar_event_id = Column(
        String(255),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
    )