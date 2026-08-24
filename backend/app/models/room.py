from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    room_code = Column(
        String(50),
        nullable=False,
    )

    room_name = Column(
        String(150),
        nullable=False,
    )

    capacity = Column(
        Integer,
        nullable=True,
    )

    location = Column(
        String(255),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    site_id = Column(
        BigInteger,
        ForeignKey("sites.site_id"),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
    )

    # Relationship to Site
    site = relationship(
        "Site",
        back_populates="rooms",
    )