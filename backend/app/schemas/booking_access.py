from typing import Literal

from pydantic import BaseModel, Field


BookingType = Literal["room", "ride"]


class BookingCodeRequest(BaseModel):
    booking_type: BookingType

    booking_id: int = Field(
        ...,
        gt=0,
    )

    # Only changes the wording of the email.
    action: Literal["cancel", "edit"] = "edit"


class BookingCodeVerify(BaseModel):
    booking_type: BookingType

    booking_id: int = Field(
        ...,
        gt=0,
    )

    code: str = Field(
        ...,
        max_length=12,
    )


class BookingAccessCancel(BaseModel):
    """Reason the requester gives when cancelling their booking."""

    reason: str = Field(
        ...,
        max_length=900,
    )
