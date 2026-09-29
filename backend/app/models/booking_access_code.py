from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Integer,
    String,
)

from app.core.database import Base


class BookingAccessCode(Base):
    """
    One-time code emailed to a requester before they may cancel or
    edit their own booking from the employee page.

    Only a keyed hash of the code is stored. A booking can have many
    rows over time, but only the newest unused, unexpired one is
    accepted; requesting a new code retires the older ones.
    """

    __tablename__ = "booking_access_code"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # "room" or "ride"
    booking_type = Column(
        String(10),
        nullable=False,
    )

    booking_id = Column(
        BigInteger,
        nullable=False,
        index=True,
    )

    code_hash = Column(
        String(64),
        nullable=False,
    )

    attempts = Column(
        Integer,
        nullable=False,
        default=0,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    # Set when the code is accepted, or when a newer code replaces it.
    used_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )
