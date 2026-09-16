from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Text,
    DateTime,
)

from app.core.database import Base


class AuditLog(Base):
    """
    One row per administrative action, written by the control panel.

    NO FOREIGN KEY TO admin.id, on purpose. An audit trail has to
    outlive the account it describes: deleting an admin must never
    delete the record of what that admin did, and must never be
    blocked by it either (``scripts/seed_admin.delete_admin``
    already has to clear the approver columns on bookings for
    exactly that reason). The actor is therefore copied in as plain
    text -- id, name and email as they were at the time -- so the
    row still reads correctly after the account is gone or renamed.

    Rows are append-only. Nothing in the panel updates or deletes
    them; a trail that can be edited from the console it audits is
    not a trail.
    """

    __tablename__ = "audit_logs"

    audit_log_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    # ---- who did it (copied, not referenced -- see above) ----

    actor_id = Column(
        BigInteger,
        nullable=True,
    )

    actor_name = Column(
        String(150),
        nullable=True,
    )

    actor_email = Column(
        String(255),
        nullable=True,
    )

    # Where the action came from: "panel" or "shell".
    source = Column(
        String(30),
        nullable=False,
        default="panel",
    )

    ip_address = Column(
        String(45),
        nullable=True,
    )

    # ---- what happened ----

    # Dotted and stable, e.g. "admin.create", "room.disable".
    action = Column(
        String(60),
        nullable=False,
        index=True,
    )

    # "success" | "blocked" | "failed" -- a refused or failed attempt
    # is as worth recording as one that went through.
    outcome = Column(
        String(20),
        nullable=False,
        default="success",
    )

    # ---- what it happened to ----

    target_type = Column(
        String(30),
        nullable=True,
    )

    target_id = Column(
        String(50),
        nullable=True,
    )

    target_label = Column(
        String(255),
        nullable=True,
    )

    # Branch of the target, where it has one.
    site = Column(
        String(50),
        nullable=True,
    )

    detail = Column(
        Text,
        nullable=True,
    )
