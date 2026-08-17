from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.core.database import Base


class Admin(Base):
    __tablename__ = "admin"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    site = Column(
        String(100),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )