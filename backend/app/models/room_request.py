from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime
from app.core.database import Base


class RoomRequest(Base):
    __tablename__ = "room_requests"

    id = Column(Integer, primary_key=True, index=True)

    request_date_time = Column(DateTime, nullable=False)

    room_id = Column(Integer, nullable=False)
    room_name = Column(String(255), nullable=False)

    employee_name = Column(String(255), nullable=False)
    employee_email = Column(String(255), nullable=False)

    reservation_date = Column(Date, nullable=False)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    duration_minute = Column(Integer, nullable=False)

    purpose = Column(Text, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    admin_remarks = Column(Text, nullable=True)

    approved_rejected_date_time = Column(
        DateTime,
        nullable=True
    )

    site = Column(String(255), nullable=False)