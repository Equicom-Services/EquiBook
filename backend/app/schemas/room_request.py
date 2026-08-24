from datetime import date, datetime, time

from pydantic import BaseModel


class RoomRequestCreate(BaseModel):
    room_id: int

    employee_name: str
    employee_email: str

    reservation_date: date

    start_time: time
    end_time: time

    purpose: str

class RoomBookingUpdate(BaseModel):
    room_id: int

    employee_name: str
    employee_email: str

    reservation_date: date

    start_time: time
    end_time: time

    purpose: str

class RoomRequestStatusUpdate(BaseModel):
    status: str
    admin_remarks: str | None = None


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
    approved_rejected_by_name: str | None = None
    approved_rejected_by_email: str | None = None

    approved_rejected_date_time: datetime | None = None

    calendar_event_id: str | None = None

    created_at: datetime
    updated_at: datetime

    room: str
    site: str

    class Config:
        from_attributes = True