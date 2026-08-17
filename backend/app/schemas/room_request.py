from datetime import date, time, datetime
from pydantic import BaseModel, EmailStr


class RoomRequestCreate(BaseModel):
    room_id: int
    room_name: str

    employee_name: str
    employee_email: EmailStr

    reservation_date: date

    start_time: time
    end_time: time

    purpose: str
    site: str


class RoomRequestResponse(BaseModel):
    id: int

    request_date_time: datetime

    room_id: int
    room_name: str

    employee_name: str
    employee_email: str

    reservation_date: date

    start_time: time
    end_time: time

    duration_minute: int

    purpose: str
    status: str

    admin_remarks: str | None
    approved_rejected_date_time: datetime | None

    site: str

    class Config:
        from_attributes = True