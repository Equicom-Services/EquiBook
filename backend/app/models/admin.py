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

    # When the admin last set their own password. NULL means they
    # have never changed it from the one they were issued, so the
    # first successful login forces a change. After that it drives
    # the 30-day expiry (see core.security.password_change_required).
    password_changed_at = Column(
        DateTime,
        nullable=True
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    # Whether this admin may open the local control panel
    # (scripts/seed_admin.py): 1 = yes, 0 = no. Every account starts
    # at 0 -- panel access is granted deliberately, one admin at a
    # time, because the panel can delete admins and reset passwords
    # for every site, not just the holder's own.
    overall_access = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0"
    )