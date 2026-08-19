from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.room_request import RoomRequest
from app.schemas.room_request import (
    RoomRequestCreate,
    RoomRequestResponse,
    RoomRequestStatusUpdate,
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

    now = datetime.now()

    new_request = RoomRequest(
        request_date_time=now,

        room_id=request.room_id,

        employee_name=request.employee_name,
        employee_email=request.employee_email,

        reservation_date=request.reservation_date,

        start_time=request.start_time,
        end_time=request.end_time,

        duration_minutes=duration,

        purpose=request.purpose,

        status="PENDING",

        admin_remarks=None,
        approved_rejected_by=None,
        approved_rejected_date_time=None,

        calendar_event_id=None,

        site=request.site,

        created_at=now,
        updated_at=now,
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request



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

    now = datetime.now()

    new_request = RoomRequest(
        request_date_time=now,

        room_id=request.room_id,

        employee_name=request.employee_name,
        employee_email=request.employee_email,

        reservation_date=request.reservation_date,

        start_time=request.start_time,
        end_time=request.end_time,

        duration_minutes=duration,

        purpose=request.purpose,

        status="PENDING",

        admin_remarks=None,
        approved_rejected_by=None,
        approved_rejected_date_time=None,

        calendar_event_id=None,

        site=request.site,

        created_at=now,
        updated_at=now,
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
        .order_by(
            RoomRequest.request_date_time.desc()
        )
        .all()
    )

    return requests


@router.put("/{request_id}/status")
def update_room_request_status(
    request_id: int,
    status: str,
    db: Session = Depends(get_db)
):

    room_request = (
        db.query(RoomRequest)
        .filter(
            RoomRequest.room_reservation_id == request_id
        )
        .first()
    )

    if not room_request:
        raise HTTPException(
            status_code=404,
            detail="Room request not found."
        )

    status = status.upper()

    if status not in ["PENDING", "APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status."
        )

    now = datetime.now()

    room_request.status = status
    room_request.updated_at = now

    if status in ["APPROVED", "REJECTED"]:
        room_request.approved_rejected_date_time = now

    db.commit()
    db.refresh(room_request)

    return room_request





@router.patch(
    "/{request_id}",
    response_model=RoomRequestResponse
)
def update_room_request_status(
    request_id: int,
    status_update: RoomRequestStatusUpdate,
    db: Session = Depends(get_db)
):

    room_request = (
        db.query(RoomRequest)
        .filter(
            RoomRequest.room_reservation_request_id == request_id
        )
        .first()
    )

    if not room_request:
        raise HTTPException(
            status_code=404,
            detail="Room request not found."
        )

    allowed_statuses = {
        "PENDING",
        "APPROVED",
        "REJECTED",
    }

    status = status_update.status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status."
        )

    now = datetime.now()

    room_request.status = status
    room_request.admin_remarks = status_update.admin_remarks
    room_request.approved_rejected_date_time = now
    room_request.approved_rejected_by = None
    room_request.updated_at = now

    db.commit()
    db.refresh(room_request)

    return room_request