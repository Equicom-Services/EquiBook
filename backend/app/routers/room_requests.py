from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room_request import RoomRequest
from app.schemas.room_request import (
    RoomRequestCreate,
    RoomRequestResponse,
)


router = APIRouter(
    prefix="/room-requests",
    tags=["Room Requests"]
)


@router.post(
    "",
    response_model=RoomRequestResponse
)
def create_room_request(
    request: RoomRequestCreate,
    db: Session = Depends(get_db)
):

    # Calculate duration
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
            detail="End time must be later than start time."
        )

    new_request = RoomRequest(
        request_date_time=datetime.now(),

        room_id=request.room_id,
        room_name=request.room_name,

        employee_name=request.employee_name,
        employee_email=request.employee_email,

        reservation_date=request.reservation_date,

        start_time=request.start_time,
        end_time=request.end_time,

        duration_minute=duration,

        purpose=request.purpose,

        status="pending",

        admin_remarks=None,
        approved_rejected_date_time=None,

        site=request.site,
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


@router.get(
    "",
    response_model=list[RoomRequestResponse]
)
def get_room_requests(
    db: Session = Depends(get_db)
):

    requests = (
        db.query(RoomRequest)
        .order_by(RoomRequest.request_date_time.desc())
        .all()
    )

    return requests