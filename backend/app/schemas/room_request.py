from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RoomRequestCreate(BaseModel):
    employee_name: str
    employee_email: str

    room_id: int

    reservation_date: date

    start_time: time
    end_time: time

    attendees: int | None = None

    purpose: str

    site: str

class RoomRequestStatusUpdate(BaseModel):
    status: str
    admin_remarks: Optional[str] = None

class RoomRequestResponse(BaseModel):
    room_reservation_id: int

    request_date_time: datetime

    room_id: int

    employee_name: str
    employee_email: str

    reservation_date: date

    start_time: time
    end_time: time

    duration_minutes: int

    purpose: str

    status: str

    admin_remarks: str | None = None

    approved_rejected_by: int | None = None

    approved_rejected_date_time: datetime | None = None

    calendar_event_id: str | None = None

    site: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )