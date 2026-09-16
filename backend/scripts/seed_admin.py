"""
Equibook control panel -- a local, offline admin console.

Run it from ``backend/`` with the venv active:

    python -m scripts.seed_admin              # open the control panel
    python -m scripts.seed_admin --seed       # just seed the ADMINS list below
    python -m scripts.seed_admin --grant EMAIL    # let that admin open the panel
    python -m scripts.seed_admin --revoke EMAIL   # take that access away

The panel (``scripts/seed_admin.html``) is served by a small stdlib HTTP
server started here, so none of this is ever part of the FastAPI app --
creating, deleting and resetting admins never becomes a live API endpoint.

It can:
  * list, add, deactivate and delete admin accounts
  * grant or revoke control panel access
  * reset an admin's password and email it to them
  * browse every room and ride booking, filtered by branch
  * chart booking volume, status mix, branch split, rooms and peak hours
  * manage the room list for every branch -- see which rooms are
    disabled, enable or disable them, add rooms and remove unused ones
  * read the audit log: every administrative action taken here, who
    took it, when, and what it landed on

SECURITY: the panel requires an Equibook admin login, and that admin must
have ``overall_access = 1``. Every account starts at 0, so access is
granted deliberately -- the panel manages admins for *every* site, not
just the holder's own. Grant the first one from the shell, which you
already need in order to run this at all (see --grant above).

An admin who has never changed their issued password cannot sign in
here: that password is the seeded default, which is not something that
should guard a panel this powerful. They set a real one in Equibook
first. Sessions live in memory only and die with the process, and the
panel still binds to 127.0.0.1 -- the login is a second lock, not a
reason to expose it.

DATA PRIVACY: every admin is emailed individually, in its own SMTP
message with exactly one recipient. Credentials for one person must
never land in another person's inbox, so nothing here batches
recipients, and there is no CC or BCC anywhere.
"""

import argparse
import json
import re
import secrets
import sys
import threading
import time
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from sqlalchemy import func

from app.core.config import settings
from app.core.database import (
    SessionLocal,
    ensure_audit_log_table,
    ensure_overall_access_column,
)
from app.core.security import (
    hash_password,
    password_change_required,
    verify_password,
)
from app.models.admin import Admin
from app.models.audit_log import AuditLog
from app.models.ride_reservation import RideReservation
from app.models.room import Room
from app.models.room_request import RoomRequest
from app.models.site import Site
from app.services.email_service import send_email


# Issued to every new admin, and to anyone whose password is reset,
# unless one is typed in explicitly. ``password_changed_at`` is left
# NULL either way, so the next login forces a replacement (see
# core.security.password_change_required).
DEFAULT_PASSWORD = "ChangeMe123"


# Accounts created by ``python -m scripts.seed_admin --seed``.
ADMINS = [
    {
        "name": "Hero Baceles",
        "email": "hero.baceles@equicomservices.com",
        "site": "Zapote",
    },
]


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]

COOKIE_NAME = "equibook_panel"

# How long a panel login stays valid without activity.
SESSION_IDLE_SECONDS = 8 * 60 * 60

# Analytics reads rows and aggregates in Python rather than in SQL:
# an office booking system is small, and it keeps the queries free of
# MySQL-only date functions. The cap stops a runaway table from
# eating the panel's memory.
ANALYTICS_ROW_CAP = 20000

# The audit table only ever grows, so reads are capped the same way.
AUDIT_ROW_CAP = 2000

# Every action the panel records, with the wording the log shows.
# Keeping the whole vocabulary in one place means the filter drop-down
# and the rows can never drift apart, and an action nobody has taken
# yet is still offered as a filter.
AUDIT_ACTIONS = {
    "session.login": "Signed in",
    "session.login_failed": "Sign-in refused",
    "session.logout": "Signed out",
    "admin.create": "Admin created",
    "admin.reset_password": "Password reset",
    "admin.activate": "Admin activated",
    "admin.deactivate": "Admin deactivated",
    "admin.grant_access": "Panel access granted",
    "admin.revoke_access": "Panel access revoked",
    "admin.delete": "Admin deleted",
    "room.create": "Room added",
    "room.enable": "Room enabled",
    "room.disable": "Room disabled",
    "room.delete": "Room deleted",
}

AUDIT_OUTCOMES = ["success", "blocked", "failed"]

# Actions taken from the command line rather than the panel: --seed,
# --grant and --revoke. Recorded with no actor, because a shell on
# this machine is not an identity the panel can vouch for.
SHELL_ACTOR = None


# ==============================================================
# EMAIL TEMPLATES
#
# Kept in this file on purpose: they are only ever sent by the
# panel, and they are the templates that carry a password, so they
# stay next to the code that decides who receives them.
# ==============================================================

def _credentials_shell(
    eyebrow: str,
    heading: str,
    intro: str,
    name: str,
    email: str,
    password: str,
    site: str,
    login_url: str,
    notice: str,
):
    """The shared body for both password emails below."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{heading}</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td align="center" style="padding:32px 20px;">

            <!-- MAIN CONTAINER -->
            <table
                width="720"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    width:100%;
                    max-width:720px;
                    background:#ffffff;
                "
            >

                <!-- HEADER -->
                <tr>
                    <td style="
                        background:#03045e;
                        padding:24px 32px;
                        color:#ffffff;
                    ">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="
                                        font-size:12px;
                                        text-transform:uppercase;
                                        letter-spacing:1px;
                                        color:#bfdbfe;
                                        margin-bottom:7px;
                                    ">
                                        {eyebrow}
                                    </div>

                                    <div style="
                                        font-size:22px;
                                        font-weight:600;
                                        line-height:1.3;
                                    ">
                                        {heading}
                                    </div>
                                </td>

                                <td
                                    align="right"
                                    valign="middle"
                                    style="
                                        font-size:13px;
                                        color:#dbeafe;
                                    "
                                >
                                    Action Required
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                    <td style="padding:32px;">

                        <p style="
                            margin:0 0 8px;
                            font-size:16px;
                            color:#111827;
                        ">
                            Hello {name},
                        </p>

                        <p style="
                            margin:0 0 28px;
                            font-size:14px;
                            line-height:1.6;
                            color:#4b5563;
                        ">
                            {intro}
                        </p>

                        <!-- SECTION TITLE -->
                        <div style="
                            font-size:13px;
                            font-weight:bold;
                            text-transform:uppercase;
                            letter-spacing:.5px;
                            color:#03045e;
                            padding-bottom:10px;
                            border-bottom:2px solid #03045e;
                        ">
                            Account Details
                        </div>

                        <!-- DETAILS -->
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="font-size:14px;"
                        >

                            <tr>
                                <td width="30%" style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Name
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {name}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Site
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {site}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Username
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {email}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                ">
                                    Temporary password
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-family:'Courier New', Courier, monospace;
                                    font-size:16px;
                                    font-weight:bold;
                                    letter-spacing:1px;
                                    color:#03045e;
                                ">
                                    {password}
                                </td>
                            </tr>

                        </table>

                        <!-- ACTION -->
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="margin-top:28px;"
                        >
                            <tr>
                                <td style="
                                    border-left:4px solid #f59e0b;
                                    background:#fffbeb;
                                    padding:14px 18px;
                                    font-size:14px;
                                    line-height:1.6;
                                    color:#92400e;
                                ">
                                    {notice}
                                </td>
                            </tr>
                        </table>

                        <!-- BUTTON -->
                        <table
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="margin-top:28px;"
                        >
                            <tr>
                                <td style="
                                    background:#03045e;
                                    padding:13px 28px;
                                ">
                                    <a
                                        href="{login_url}"
                                        style="
                                            color:#ffffff;
                                            font-size:14px;
                                            font-weight:600;
                                            text-decoration:none;
                                        "
                                    >
                                        Sign in to Equibook
                                    </a>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="
                        background:#f8fafc;
                        border-top:1px solid #e5e7eb;
                        padding:18px 32px;
                        font-size:12px;
                        line-height:1.6;
                        color:#94a3b8;
                    ">
                        This is an automated message from Equibook. If you were
                        not expecting this email, please contact the IT
                        department.
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
"""


def admin_credentials_email(
    name: str,
    email: str,
    password: str,
    site: str,
    login_url: str,
):
    return _credentials_shell(
        eyebrow="EQUIBOOK ADMIN ACCESS",
        heading="Your Admin Account Is Ready",
        intro=(
            f"An Equibook administrator account has been created for you "
            f"for the {site} site. Your sign-in details are below."
        ),
        name=name,
        email=email,
        password=password,
        site=site,
        login_url=login_url,
        notice=(
            "For your security, Equibook will ask you to set a new password "
            "the first time you sign in. Please do not share this email or "
            "the temporary password with anyone."
        ),
    )


def password_reset_email(
    name: str,
    email: str,
    password: str,
    site: str,
    login_url: str,
):
    return _credentials_shell(
        eyebrow="EQUIBOOK ADMIN ACCESS",
        heading="Your Password Has Been Reset",
        intro=(
            "Your Equibook administrator password has been reset. Use the "
            "temporary password below to sign in."
        ),
        name=name,
        email=email,
        password=password,
        site=site,
        login_url=login_url,
        notice=(
            "Equibook will ask you to set a new password as soon as you sign "
            "in. If you did not request this reset, contact the IT department "
            "straight away."
        ),
    )


# ==============================================================
# SHARED HELPERS
# ==============================================================

def login_url() -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/EquiBook/admin/login"


def send_one(recipients_email: str, subject: str, html_body: str):
    """
    Send to exactly one person.

    Everything in the panel goes through here so no call site can
    grow a second recipient by accident.
    """
    send_email(
        recipients=[recipients_email],
        subject=subject,
        html_body=html_body,
    )


def parse_date(value, fallback=None):
    if not value:
        return fallback

    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()

    except ValueError:
        return fallback


def iso(value):
    if value is None:
        return None

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    return str(value)


# ==============================================================
# AUDIT LOG
#
# Every administrative action this panel performs is recorded to
# the ``audit_logs`` table before the response goes out. The rules:
#
#   * The record is written by the route, not by the domain
#     function, because the route is where the actor and their
#     address are known -- and because the same domain functions
#     are called from the shell, which is recorded differently.
#   * Refusals are recorded too ("blocked"), including a failed
#     sign-in. An attempt that did not go through is often the more
#     interesting line in the log.
#   * A failure to write the log never fails the action it is
#     recording. Losing a line is bad; losing a password reset
#     because its log line could not be written is worse. The loss
#     is printed to the console the panel runs in, which is the one
#     place someone is guaranteed to be watching.
#   * Nothing here writes a password, a hash, or any part of one.
# ==============================================================

def record_audit(
    actor: dict | None,
    action: str,
    *,
    outcome: str = "success",
    target_type: str = "",
    target_id=None,
    target_label: str = "",
    site: str = "",
    detail: str = "",
    source: str = "panel",
    ip_address: str = "",
):
    """Append one line to the audit log. Never raises."""
    db = SessionLocal()

    try:
        db.add(AuditLog(
            created_at=datetime.now(),
            actor_id=(actor or {}).get("admin_id"),
            actor_name=(actor or {}).get("name"),
            actor_email=(actor or {}).get("email"),
            source=source,
            ip_address=(ip_address or None),
            action=action,
            outcome=outcome,
            target_type=(target_type or None),
            target_id=(str(target_id) if target_id is not None else None),
            target_label=(target_label or None),
            site=(site or None),
            detail=(detail or None),
        ))

        db.commit()

    except Exception as error:
        db.rollback()
        sys.stdout.write(f"  audit log write failed ({action}): {error}\n")

    finally:
        db.close()


def audit_row(entry: AuditLog) -> dict:
    return {
        "id": entry.audit_log_id,
        "at": iso(entry.created_at),
        "actor_id": entry.actor_id,
        "actor_name": entry.actor_name or "",
        "actor_email": entry.actor_email or "",
        "source": entry.source or "panel",
        "ip_address": entry.ip_address or "",
        "action": entry.action,
        "action_label": AUDIT_ACTIONS.get(entry.action, entry.action),
        "outcome": entry.outcome or "success",
        "target_type": entry.target_type or "",
        "target_id": entry.target_id or "",
        "target_label": entry.target_label or "",
        "site": entry.site or "",
        "detail": entry.detail or "",
    }


def fetch_audit_logs(
    action: str = "",
    outcome: str = "",
    actor: str = "",
    site: str = "",
    search: str = "",
    start: date | None = None,
    end: date | None = None,
    limit: int = AUDIT_ROW_CAP,
) -> dict:
    """
    Newest first, filtered.

    ``end`` is a date, and the rows carry a timestamp, so the range
    is closed with the *next* midnight -- otherwise "to today" would
    silently drop everything that happened today after 00:00.
    """
    db = SessionLocal()

    try:
        query = db.query(AuditLog)

        if start:
            query = query.filter(AuditLog.created_at >= datetime.combine(start, datetime.min.time()))

        if end:
            query = query.filter(
                AuditLog.created_at
                < datetime.combine(end + timedelta(days=1), datetime.min.time())
            )

        if action:
            query = query.filter(AuditLog.action == action)

        if outcome:
            query = query.filter(AuditLog.outcome == outcome)

        if actor:
            query = query.filter(AuditLog.actor_email == actor)

        if site:
            query = query.filter(AuditLog.site == site)

        if search:
            like = f"%{search.strip()}%"

            query = query.filter(
                AuditLog.target_label.like(like)
                | AuditLog.detail.like(like)
                | AuditLog.actor_name.like(like)
                | AuditLog.actor_email.like(like)
            )

        total = query.count()

        entries = (
            query
            .order_by(AuditLog.created_at.desc(), AuditLog.audit_log_id.desc())
            .limit(limit)
            .all()
        )

        # The actor list is drawn from the whole table, not from the
        # filtered rows: a drop-down that only offers the people
        # already on screen cannot be used to find anybody else.
        actors = (
            db.query(AuditLog.actor_email, AuditLog.actor_name)
            .filter(AuditLog.actor_email.isnot(None))
            .distinct()
            .order_by(AuditLog.actor_email)
            .all()
        )

        return {
            "entries": [audit_row(entry) for entry in entries],
            "count": total,
            "truncated": total > len(entries),
            "actors": [
                {"email": email, "name": name or email}
                for email, name in actors
            ],
        }

    finally:
        db.close()


# ==============================================================
# SESSIONS
#
# In memory only: stopping the server signs everybody out, which is
# the right lifetime for a tool you start when you need it. Tokens
# are compared with secrets.compare_digest so a wrong guess cannot be
# narrowed down by timing.
# ==============================================================

_sessions: dict[str, dict] = {}
_sessions_lock = threading.Lock()


def open_session(admin: Admin) -> str:
    token = secrets.token_urlsafe(32)

    with _sessions_lock:
        _sessions[token] = {
            "admin_id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "site": admin.site,
            "seen": time.time(),
        }

    return token


def read_session(token: str | None) -> dict | None:
    if not token:
        return None

    now = time.time()

    with _sessions_lock:
        for known, session in list(_sessions.items()):
            if now - session["seen"] > SESSION_IDLE_SECONDS:
                del _sessions[known]

        for known, session in _sessions.items():
            if secrets.compare_digest(known, token):
                session["seen"] = now
                return dict(session)

    return None


def close_session(token: str | None):
    if not token:
        return

    with _sessions_lock:
        _sessions.pop(token, None)


def authenticate(email: str, password: str) -> Admin:
    """
    Check panel credentials, or raise ValueError with a reason.

    The reasons are deliberately specific. This panel is reachable
    only from the machine it runs on by someone who already has a
    shell there, so telling them *why* they were turned away is more
    useful than withholding it -- and being vague would just mean
    guessing at which of the four gates they failed.
    """
    email = str(email or "").strip().lower()
    password = str(password or "")

    if not email or not password:
        raise ValueError("Enter your email and password.")

    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.email == email).first()

        if not admin or not verify_password(password, admin.password_hash):
            raise ValueError("Wrong email or password.")

        if not admin.is_active:
            raise ValueError("That account is deactivated.")

        if not admin.overall_access:
            raise ValueError(
                "That account does not have control panel access. Someone "
                "who already has it can grant yours, or run "
                f"python -m scripts.seed_admin --grant {admin.email}"
            )

        if password_change_required(admin):
            raise ValueError(
                "That password is the one you were issued, or it has "
                "expired. Sign in to Equibook and set a new one first -- a "
                "default password should not open this panel."
            )

        db.expunge(admin)
        return admin

    finally:
        db.close()


def set_overall_access(
    admin_id: int,
    granted: bool,
    allow_last: bool = False,
) -> dict:
    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.id == admin_id).first()

        if not admin:
            raise ValueError("That admin no longer exists.")

        # Revoking the last holder leaves the panel openable by nobody.
        # Refused from the panel itself, allowed from the shell
        # (allow_last): that is where --grant lives, so it is the
        # recovery path rather than a way to get stuck, and switching
        # the panel off for everyone is a legitimate thing to want.
        if (
            not granted
            and not allow_last
            and count_panel_admins(db, exclude_id=admin.id) == 0
        ):
            raise ValueError(
                "This is the last admin with panel access - revoking it "
                "would lock the panel for everyone."
            )

        admin.overall_access = 1 if granted else 0

        db.commit()
        db.refresh(admin)

        state = "can now open the control panel" if granted else "no longer has panel access"

        return {
            "admin": admin_row(admin),
            "message": f"{admin.name} {state}.",
        }

    finally:
        db.close()


def count_panel_admins(db, exclude_id: int | None = None) -> int:
    query = (
        db.query(Admin)
        .filter(Admin.overall_access == 1)
        .filter(Admin.is_active == True)
    )

    if exclude_id is not None:
        query = query.filter(Admin.id != exclude_id)

    return query.count()


def grant_by_email(email: str, granted: bool) -> str:
    """Back the --grant / --revoke flags."""
    email = str(email or "").strip().lower()

    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.email == email).first()

        if not admin:
            # Raised rather than returned so the caller can tell a
            # miss from a change that went through -- ``main`` prints
            # it the same either way, but the audit line does not
            # record a grant that never happened as a success.
            raise ValueError(f"No admin found with the email {email}.")

        admin_id = admin.id
        last_one = (
            not granted
            and count_panel_admins(db, exclude_id=admin_id) == 0
        )

    finally:
        db.close()

    message = set_overall_access(admin_id, granted, allow_last=True)["message"]

    if last_one:
        message += (
            "\nNo admin can open the control panel now. Run --grant to "
            "let someone back in."
        )

    return message


# ==============================================================
# SITES
# ==============================================================

def active_site_names() -> list[str]:
    db = SessionLocal()

    try:
        sites = (
            db.query(Site)
            .filter(Site.is_active == True)
            .order_by(Site.site_name)
            .all()
        )

        return [site.site_name for site in sites]

    finally:
        db.close()


# ==============================================================
# ADMINS
# ==============================================================

def admin_row(admin: Admin) -> dict:
    changed_at = admin.password_changed_at

    if changed_at is None:
        password_age_days = None
        password_state = "never changed"

    else:
        password_age_days = (datetime.now() - changed_at).days

        if password_age_days >= settings.PASSWORD_EXPIRY_DAYS:
            password_state = "expired"
        else:
            password_state = f"{password_age_days}d old"

    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "site": admin.site,
        "is_active": bool(admin.is_active),
        "overall_access": 1 if admin.overall_access else 0,
        "created_at": iso(admin.created_at),
        "password_changed_at": iso(changed_at),
        "password_age_days": password_age_days,
        "password_state": password_state,
    }


def list_admins() -> list[dict]:
    db = SessionLocal()

    try:
        admins = (
            db.query(Admin)
            .order_by(Admin.site, Admin.name)
            .all()
        )

        return [admin_row(admin) for admin in admins]

    finally:
        db.close()


def validate_entry(entry: dict) -> dict:
    """Return a cleaned entry, or raise ValueError with a reason."""
    name = str(entry.get("name") or "").strip()
    email = str(entry.get("email") or "").strip().lower()
    site = str(entry.get("site") or "").strip()
    password = str(entry.get("password") or "").strip() or DEFAULT_PASSWORD

    if not name:
        raise ValueError("Name is required.")

    if not email:
        raise ValueError("Email is required.")

    if not EMAIL_PATTERN.match(email):
        raise ValueError("That email address does not look valid.")

    if not site:
        raise ValueError("Site is required.")

    return {
        "name": name,
        "email": email,
        "site": site,
        "password": password,
    }


def create_admin(db, name: str, email: str, site: str, password: str):
    """
    Create one admin row.

    Returns (created, message). ``created`` is False when the email
    is already taken -- seeding is re-runnable, so an existing
    account is skipped rather than overwritten, and no email goes out.
    """
    existing = (
        db.query(Admin)
        .filter(Admin.email == email)
        .first()
    )

    if existing:
        return False, "Admin already exists - skipped."

    admin = Admin(
        name=name,
        email=email,
        password_hash=hash_password(password),
        site=site,
        is_active=True,
        # Panel access is never handed out at creation time; it is
        # granted afterwards, per admin, on purpose.
        overall_access=0,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return True, "Admin account created."


def seed_admins(entries: list[dict]) -> list[dict]:
    """
    Create every admin in ``entries`` and email each one separately.

    One SMTP message per admin, sent one after the other, each
    addressed to that admin alone -- see the data privacy note at the
    top of this file. A failed email never rolls back the account; it
    is reported so the password can be re-sent.
    """
    results = []
    seen = set()

    db = SessionLocal()

    try:
        for entry in entries:
            try:
                clean = validate_entry(entry)

            except ValueError as error:
                results.append({
                    "name": str(entry.get("name") or "").strip(),
                    "email": str(entry.get("email") or "").strip(),
                    "site": str(entry.get("site") or "").strip(),
                    "created": False,
                    "emailed": False,
                    "message": str(error),
                })
                continue

            if clean["email"] in seen:
                results.append({
                    **{key: clean[key] for key in ("name", "email", "site")},
                    "created": False,
                    "emailed": False,
                    "message": "Duplicate email in this batch - skipped.",
                })
                continue

            seen.add(clean["email"])

            result = {
                "name": clean["name"],
                "email": clean["email"],
                "site": clean["site"],
                "created": False,
                "emailed": False,
                "message": "",
            }

            try:
                created, message = create_admin(
                    db,
                    clean["name"],
                    clean["email"],
                    clean["site"],
                    clean["password"],
                )

            except Exception as error:
                db.rollback()

                result["message"] = f"Could not create account: {error}"
                results.append(result)
                continue

            result["created"] = created
            result["message"] = message

            if not created:
                results.append(result)
                continue

            try:
                send_one(
                    clean["email"],
                    "Your Equibook admin account",
                    admin_credentials_email(
                        name=clean["name"],
                        email=clean["email"],
                        password=clean["password"],
                        site=clean["site"],
                        login_url=login_url(),
                    ),
                )

                result["emailed"] = True
                result["message"] = "Admin account created and credentials emailed."

            except Exception as error:
                result["message"] = (
                    f"Account created, but the email failed to send: {error}"
                )

            results.append(result)

        return results

    finally:
        db.close()


def reset_password(admin_id: int, password: str = "") -> dict:
    """
    Issue a new password for one admin and email it to them.

    ``password_changed_at`` is cleared so Equibook forces them to
    choose their own password on the next sign-in.
    """
    password = str(password or "").strip() or DEFAULT_PASSWORD

    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.id == admin_id).first()

        if not admin:
            raise ValueError("That admin no longer exists.")

        admin.password_hash = hash_password(password)
        admin.password_changed_at = None

        db.commit()
        db.refresh(admin)

        result = {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "emailed": False,
            "message": "Password reset, but the email could not be sent.",
        }

        try:
            send_one(
                admin.email,
                "Your Equibook password has been reset",
                password_reset_email(
                    name=admin.name,
                    email=admin.email,
                    password=password,
                    site=admin.site,
                    login_url=login_url(),
                ),
            )

            result["emailed"] = True
            result["message"] = "Password reset and emailed to the admin."

        except Exception as error:
            result["message"] = (
                f"Password reset, but the email failed to send: {error}"
            )

        return result

    finally:
        db.close()


def count_active_admins(db, exclude_id: int | None = None) -> int:
    query = db.query(Admin).filter(Admin.is_active == True)

    if exclude_id is not None:
        query = query.filter(Admin.id != exclude_id)

    return query.count()


def set_admin_active(admin_id: int, is_active: bool) -> dict:
    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.id == admin_id).first()

        if not admin:
            raise ValueError("That admin no longer exists.")

        # Deactivating the only remaining active admin would lock
        # everybody out of Equibook, so it is refused here.
        if not is_active and count_active_admins(db, exclude_id=admin.id) == 0:
            raise ValueError(
                "This is the last active admin - deactivating it would "
                "lock everyone out."
            )

        if (
            not is_active
            and admin.overall_access
            and count_panel_admins(db, exclude_id=admin.id) == 0
        ):
            raise ValueError(
                "This is the last admin with control panel access - "
                "deactivating it would lock this panel for everyone."
            )

        admin.is_active = is_active
        db.commit()
        db.refresh(admin)

        state = "reactivated" if is_active else "deactivated"

        return {
            "admin": admin_row(admin),
            "message": f"{admin.name} {state}.",
        }

    finally:
        db.close()


def admin_reference_counts(db, admin_id: int) -> dict:
    """How many bookings record this admin as the approver/rejecter."""
    rooms = (
        db.query(RoomRequest)
        .filter(RoomRequest.approved_rejected_by == admin_id)
        .count()
    )

    rides = (
        db.query(RideReservation)
        .filter(RideReservation.approved_rejected_by == admin_id)
        .count()
    )

    return {"rooms": rooms, "rides": rides, "total": rooms + rides}


def delete_admin(admin_id: int, force: bool = False) -> dict:
    """
    Delete an admin row.

    Refused while bookings still name them as the approver, unless
    ``force``. Rides have a real foreign key to admin.id, so the
    delete would fail at the database anyway; forcing clears the
    approver on those rows first, which loses that piece of the audit
    trail. Deactivating is the reversible alternative.
    """
    db = SessionLocal()

    try:
        admin = db.query(Admin).filter(Admin.id == admin_id).first()

        if not admin:
            raise ValueError("That admin no longer exists.")

        if count_active_admins(db, exclude_id=admin.id) == 0:
            raise ValueError(
                "This is the last active admin - deleting it would lock "
                "everyone out."
            )

        if admin.overall_access and count_panel_admins(db, exclude_id=admin.id) == 0:
            raise ValueError(
                "This is the last admin with control panel access - "
                "deleting it would lock this panel for everyone. Grant "
                "another admin access first."
            )

        references = admin_reference_counts(db, admin.id)

        if references["total"] and not force:
            return {
                "deleted": False,
                "needs_force": True,
                "references": references,
                "message": (
                    f"{admin.name} is recorded as the approver on "
                    f"{references['total']} booking(s) "
                    f"({references['rooms']} room, {references['rides']} ride). "
                    "Deactivate instead, or confirm to delete and clear that "
                    "approver from those bookings."
                ),
            }

        if references["total"]:
            db.query(RoomRequest).filter(
                RoomRequest.approved_rejected_by == admin.id
            ).update(
                {RoomRequest.approved_rejected_by: None},
                synchronize_session=False,
            )

            db.query(RideReservation).filter(
                RideReservation.approved_rejected_by == admin.id
            ).update(
                {RideReservation.approved_rejected_by: None},
                synchronize_session=False,
            )

        name = admin.name

        db.delete(admin)
        db.commit()

        return {
            "deleted": True,
            "needs_force": False,
            "references": references,
            "message": f"{name} deleted.",
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ==============================================================
# ROOMS
#
# The facility list, for every branch. Deliberately not scoped to
# the signed-in admin's own site, which matches
# ``app/routers/rooms.py``: any admin may maintain rooms anywhere,
# because this is the list of rooms that exist, not the bookings
# made against them. Everything else in the panel that touches
# booking data stays branch-filterable.
#
# The rules below are the same ones the API enforces, restated
# here rather than imported, because the panel talks to the
# database directly and never goes through FastAPI:
#   * room codes are unique across every site
#   * a room that has ever been booked cannot be deleted, only
#     disabled -- its reservations point at it by room_id
# ==============================================================

ROOM_STATES = ["active", "disabled"]


def room_booking_counts(db) -> tuple[dict, dict]:
    """(bookings per room, upcoming approved bookings per room)."""
    totals = dict(
        db.query(
            RoomRequest.room_id,
            func.count(RoomRequest.room_reservation_id),
        )
        .group_by(RoomRequest.room_id)
        .all()
    )

    upcoming = dict(
        db.query(
            RoomRequest.room_id,
            func.count(RoomRequest.room_reservation_id),
        )
        .filter(RoomRequest.reservation_date >= date.today())
        .filter(func.upper(RoomRequest.status) == "APPROVED")
        .group_by(RoomRequest.room_id)
        .all()
    )

    return totals, upcoming


def room_row(room: Room, site_name: str, bookings: int, upcoming: int) -> dict:
    return {
        "id": room.room_id,
        "room_code": room.room_code,
        "room_name": room.room_name,
        "site": site_name,
        "site_id": room.site_id,
        "capacity": room.capacity,
        "location": room.location or "",
        "is_active": bool(room.is_active),
        "bookings": bookings,
        "upcoming": upcoming,
        # Deletion is refused once a room has history, so the page
        # can say so up front instead of offering a button that
        # only ever returns an error.
        "deletable": bookings == 0,
        "created_at": iso(room.created_at),
        "updated_at": iso(room.updated_at),
    }


def list_rooms(site: str = "", state: str = "") -> dict:
    db = SessionLocal()

    try:
        totals, upcoming = room_booking_counts(db)

        query = (
            db.query(Room, Site)
            .join(Site, Site.site_id == Room.site_id)
        )

        if site:
            query = query.filter(Site.site_name == site)

        if state == "active":
            query = query.filter(Room.is_active == True)

        elif state == "disabled":
            query = query.filter(Room.is_active == False)

        rows = (
            query
            .order_by(Site.site_name, Room.room_name)
            .all()
        )

        rooms = [
            room_row(
                room,
                site_row.site_name,
                totals.get(room.room_id, 0),
                upcoming.get(room.room_id, 0),
            )
            for room, site_row in rows
        ]

        # Counted across every room, not just the filtered ones: the
        # point of the summary is to answer "is anything disabled?"
        # without first having to guess the filter that would show it.
        every = (
            db.query(Room, Site)
            .join(Site, Site.site_id == Room.site_id)
            .all()
        )

        disabled = [
            {
                "room_name": room.room_name,
                "room_code": room.room_code,
                "site": site_row.site_name,
                "upcoming": upcoming.get(room.room_id, 0),
            }
            for room, site_row in every
            if not room.is_active
        ]

        return {
            "rooms": rooms,
            "summary": {
                "total": len(every),
                "active": len(every) - len(disabled),
                "disabled": len(disabled),
                "branches": len({site_row.site_name for _, site_row in every}),
                "shown": len(rooms),
            },
            # Disabled rooms that still have approved bookings ahead
            # of them: nobody can book them any more, but the people
            # already holding a reservation have not been told.
            "stranded": [row for row in disabled if row["upcoming"]],
        }

    finally:
        db.close()


def create_room(
    room_code: str,
    room_name: str,
    capacity,
    location: str,
    site_name: str,
) -> dict:
    room_code = str(room_code or "").strip()
    room_name = str(room_name or "").strip()
    location = str(location or "").strip()
    site_name = str(site_name or "").strip()

    if not room_code:
        raise ValueError("Room code is required.")

    if not room_name:
        raise ValueError("Room name is required.")

    try:
        capacity = int(capacity)

    except (TypeError, ValueError):
        raise ValueError("Capacity must be a whole number.")

    if capacity <= 0:
        raise ValueError("Capacity must be greater than 0.")

    db = SessionLocal()

    try:
        site = (
            db.query(Site)
            .filter(Site.site_name == site_name)
            .filter(Site.is_active == True)
            .first()
        )

        if not site:
            raise ValueError(
                f'"{site_name}" is not an active branch. Pick another.'
            )

        existing = (
            db.query(Room)
            .filter(Room.room_code == room_code)
            .first()
        )

        if existing:
            # Codes are unique across every site, so the clash is
            # usually at a branch the admin was not looking at --
            # name it, or the error is baffling.
            where = (
                db.query(Site)
                .filter(Site.site_id == existing.site_id)
                .first()
            )

            raise ValueError(
                f'Room code "{room_code}" is already used by '
                f'"{existing.room_name}" at '
                f'{where.site_name if where else "another branch"}.'
            )

        now = datetime.now()

        room = Room(
            room_code=room_code,
            room_name=room_name,
            capacity=capacity,
            location=location or None,
            is_active=True,
            site_id=site.site_id,
            created_at=now,
            updated_at=now,
        )

        db.add(room)
        db.commit()
        db.refresh(room)

        return {
            "room": room_row(room, site.site_name, 0, 0),
            "message": f'"{room_name}" added to {site.site_name}.',
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def set_room_active(room_id: int, is_active: bool) -> dict:
    db = SessionLocal()

    try:
        room = db.query(Room).filter(Room.room_id == room_id).first()

        if not room:
            raise ValueError("That room no longer exists.")

        site = db.query(Site).filter(Site.site_id == room.site_id).first()
        site_name = site.site_name if site else ""

        room.is_active = bool(is_active)
        room.updated_at = datetime.now()

        db.commit()
        db.refresh(room)

        totals, upcoming = room_booking_counts(db)

        ahead = upcoming.get(room.room_id, 0)

        message = (
            f'"{room.room_name}" is bookable again.'
            if is_active
            else f'"{room.room_name}" is hidden from the booking forms.'
        )

        # Disabling does not touch reservations already approved
        # against the room, so say how many are still standing
        # rather than let them go unnoticed.
        if not is_active and ahead:
            message += (
                f" {ahead} approved booking(s) still ahead of it are "
                "untouched - cancel them in Equibook if they should "
                "not go ahead."
            )

        return {
            "room": room_row(
                room,
                site_name,
                totals.get(room.room_id, 0),
                ahead,
            ),
            "message": message,
        }

    finally:
        db.close()


def delete_room(room_id: int) -> dict:
    """
    Remove a room that has never been booked.

    A room with reservations is never deletable, not even forced:
    the bookings and every report built on them point at it by
    room_id, and there is no equivalent of the admin delete's
    "clear the reference" that would not corrupt booking history.
    Disabling is the answer, and the error says so.
    """
    db = SessionLocal()

    try:
        room = db.query(Room).filter(Room.room_id == room_id).first()

        if not room:
            raise ValueError("That room no longer exists.")

        site = db.query(Site).filter(Site.site_id == room.site_id).first()

        bookings = (
            db.query(RoomRequest)
            .filter(RoomRequest.room_id == room.room_id)
            .count()
        )

        if bookings:
            raise ValueError(
                f'"{room.room_name}" has {bookings} reservation(s) on '
                "record and cannot be deleted. Disable it instead - that "
                "hides it from new bookings and keeps the history."
            )

        name = room.room_name
        code = room.room_code
        site_name = site.site_name if site else ""

        db.delete(room)
        db.commit()

        return {
            "deleted": True,
            "room_name": name,
            "room_code": code,
            "site": site_name,
            "message": f'"{name}" deleted from {site_name or "its branch"}.',
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ==============================================================
# BOOKINGS
# ==============================================================

def fetch_room_bookings(db, site: str, start: date, end: date, limit: int):
    query = (
        db.query(RoomRequest, Room, Site)
        .join(Room, Room.room_id == RoomRequest.room_id)
        .join(Site, Site.site_id == Room.site_id)
        .filter(RoomRequest.reservation_date >= start)
        .filter(RoomRequest.reservation_date <= end)
    )

    if site:
        query = query.filter(Site.site_name == site)

    rows = (
        query
        .order_by(RoomRequest.reservation_date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "kind": "Room",
            "id": request.room_reservation_id,
            "employee_name": request.employee_name,
            "employee_email": request.employee_email,
            "site": site_row.site_name,
            "detail": f"{room.room_name} ({room.room_code})",
            "room": room.room_name,
            "date": iso(request.reservation_date),
            "time": f"{request.start_time} - {request.end_time}",
            "start_hour": request.start_time.hour if request.start_time else None,
            "duration_minutes": request.duration_minutes,
            "passengers": None,
            "status": (request.status or "").upper(),
            "purpose": request.purpose,
            "requested_at": iso(request.request_date_time),
        }
        for request, room, site_row in rows
    ]


def fetch_ride_bookings(db, site: str, start: date, end: date, limit: int):
    query = (
        db.query(RideReservation)
        .filter(RideReservation.travel_date >= start)
        .filter(RideReservation.travel_date <= end)
    )

    if site:
        query = query.filter(RideReservation.site == site)

    rows = (
        query
        .order_by(RideReservation.travel_date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "kind": "Ride",
            "id": ride.ride_reservation_id,
            "employee_name": ride.employee_name,
            "employee_email": ride.employee_email,
            "site": ride.site,
            "detail": f"{ride.pickup_location} → {ride.dropoff_destination}",
            "room": None,
            "date": iso(ride.travel_date),
            "time": str(ride.departure_time),
            "start_hour": ride.departure_time.hour if ride.departure_time else None,
            "duration_minutes": None,
            "passengers": ride.passenger_count,
            "status": (ride.status or "").upper(),
            "purpose": ride.purpose,
            "requested_at": iso(ride.request_date_time),
        }
        for ride in rows
    ]


def fetch_bookings(
    kind: str = "",
    site: str = "",
    status: str = "",
    start: date | None = None,
    end: date | None = None,
    limit: int = ANALYTICS_ROW_CAP,
) -> list[dict]:
    start = start or date.today() - timedelta(days=90)
    end = end or date.today() + timedelta(days=365)

    db = SessionLocal()

    try:
        rows = []

        if kind in ("", "room"):
            rows += fetch_room_bookings(db, site, start, end, limit)

        if kind in ("", "ride"):
            rows += fetch_ride_bookings(db, site, start, end, limit)

    finally:
        db.close()

    if status:
        rows = [row for row in rows if row["status"] == status.upper()]

    rows.sort(key=lambda row: (row["date"] or "", row["time"] or ""), reverse=True)

    return rows


# ==============================================================
# ANALYTICS
#
# Everything is derived from the same filtered row set the bookings
# table shows, so a number in a chart always matches the rows behind
# it.
# ==============================================================

def build_analytics(rows: list[dict], start: date, end: date) -> dict:
    total = len(rows)

    by_status = Counter(row["status"] for row in rows)
    by_kind = Counter(row["kind"] for row in rows)

    by_site = defaultdict(lambda: {
        "site": "",
        "total": 0,
        "rooms": 0,
        "rides": 0,
        **{status: 0 for status in STATUSES},
    })

    by_day = Counter()
    by_hour = Counter()
    by_room = Counter()
    by_requester = Counter()

    durations = []

    for row in rows:
        site_name = row["site"] or "(no site)"

        bucket = by_site[site_name]
        bucket["site"] = site_name
        bucket["total"] += 1
        bucket["rooms" if row["kind"] == "Room" else "rides"] += 1

        if row["status"] in bucket:
            bucket[row["status"]] += 1

        if row["date"]:
            by_day[row["date"]] += 1

        if row["start_hour"] is not None:
            by_hour[row["start_hour"]] += 1

        if row["room"]:
            by_room[(row["room"], site_name)] += 1

        if row["employee_email"]:
            by_requester[(row["employee_name"], row["employee_email"])] += 1

        if row["duration_minutes"]:
            durations.append(row["duration_minutes"])

    decided = by_status["APPROVED"] + by_status["REJECTED"]

    approval_rate = (
        round(by_status["APPROVED"] / decided * 100)
        if decided else 0
    )

    # A continuous day axis, so quiet days show as gaps in the line
    # rather than being silently collapsed.
    span = (end - start).days

    if 0 <= span <= 120:
        cursor = start
        series = []

        while cursor <= end:
            key = cursor.isoformat()
            series.append({"label": key, "value": by_day.get(key, 0)})
            cursor += timedelta(days=1)

    else:
        by_month = Counter()

        for key, count in by_day.items():
            by_month[key[:7]] += count

        series = [
            {"label": key, "value": by_month[key]}
            for key in sorted(by_month)
        ]

    return {
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "totals": {
            "total": total,
            "rooms": by_kind["Room"],
            "rides": by_kind["Ride"],
            "pending": by_status["PENDING"],
            "approved": by_status["APPROVED"],
            "rejected": by_status["REJECTED"],
            "cancelled": by_status["CANCELLED"],
            "approval_rate": approval_rate,
            "avg_duration_minutes": (
                round(sum(durations) / len(durations)) if durations else 0
            ),
            "branches": len(by_site),
        },
        "by_status": [
            {"label": status, "value": by_status[status]}
            for status in STATUSES
        ],
        "by_kind": [
            {"label": "Rooms", "value": by_kind["Room"]},
            {"label": "Rides", "value": by_kind["Ride"]},
        ],
        "by_site": sorted(
            by_site.values(),
            key=lambda bucket: bucket["total"],
            reverse=True,
        ),
        "series": series,
        "by_hour": [
            {"label": f"{hour:02d}:00", "value": by_hour.get(hour, 0)}
            for hour in range(6, 21)
        ],
        "top_rooms": [
            {"label": room, "site": site_name, "value": count}
            for (room, site_name), count in by_room.most_common(8)
        ],
        "top_requesters": [
            {"label": name, "email": email, "value": count}
            for (name, email), count in by_requester.most_common(8)
        ],
    }


# ==============================================================
# LOCAL HTTP SERVER
# ==============================================================

PAGE_PATH = Path(__file__).with_name("seed_admin.html")


class ControlPanelHandler(BaseHTTPRequestHandler):

    server_version = "EquibookControlPanel"

    # ---------------- plumbing ----------------

    def _json(self, status: int, payload: dict):
        body = json.dumps(payload, default=str).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self) -> str:
        # Recorded on every audit line. It is nearly always
        # 127.0.0.1 -- the panel binds to loopback -- but it stops
        # being a constant the moment someone tunnels in, which is
        # exactly when it matters.
        try:
            return self.client_address[0]

        except Exception:
            return ""

    def _cookie_token(self) -> str | None:
        raw = self.headers.get("Cookie")

        if not raw:
            return None

        try:
            jar = SimpleCookie(raw)

        except Exception:
            return None

        morsel = jar.get(COOKIE_NAME)

        return morsel.value if morsel else None

    def _set_cookie(self, token: str | None):
        if token:
            # HttpOnly keeps the token out of page scripts; SameSite
            # blocks another site from driving the panel through the
            # browser of whoever is signed in.
            self.send_header(
                "Set-Cookie",
                f"{COOKIE_NAME}={token}; HttpOnly; SameSite=Strict; Path=/",
            )
        else:
            self.send_header(
                "Set-Cookie",
                f"{COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
            )

    def _require_session(self) -> dict | None:
        """The signed-in admin, or None after answering with a 401."""
        session = read_session(self._cookie_token())

        if session:
            return session

        self._json(401, {"detail": "Please sign in.", "authenticated": False})
        return None

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)

        try:
            payload = json.loads(self.rfile.read(length) or b"{}")

        except json.JSONDecodeError:
            raise ValueError("Malformed request body.")

        if not isinstance(payload, dict):
            raise ValueError("Malformed request body.")

        return payload

    def _audit(self, session, action, **fields):
        """Record one panel action against the signed-in admin."""
        record_audit(
            session,
            action,
            source="panel",
            ip_address=self._client_ip(),
            **fields,
        )

    def _room_filters(self, params: dict):
        site = params.get("site", [""])[0] or ""
        state = (params.get("state", [""])[0] or "").lower()

        if state not in ROOM_STATES:
            state = ""

        return site, state

    def _audit_filters(self, params: dict):
        action = params.get("action", [""])[0] or ""
        outcome = (params.get("outcome", [""])[0] or "").lower()
        actor = params.get("actor", [""])[0] or ""
        site = params.get("site", [""])[0] or ""
        search = params.get("q", [""])[0] or ""

        start = parse_date(
            params.get("from", [""])[0],
            date.today() - timedelta(days=30),
        )

        end = parse_date(params.get("to", [""])[0], date.today())

        if start > end:
            start, end = end, start

        if action not in AUDIT_ACTIONS:
            action = ""

        if outcome not in AUDIT_OUTCOMES:
            outcome = ""

        return action, outcome, actor, site, search, start, end

    def _filters(self, params: dict):
        kind = (params.get("kind", [""])[0] or "").lower()
        site = params.get("site", [""])[0] or ""
        status = params.get("status", [""])[0] or ""

        start = parse_date(
            params.get("from", [""])[0],
            date.today() - timedelta(days=90),
        )

        end = parse_date(
            params.get("to", [""])[0],
            date.today() + timedelta(days=90),
        )

        if start > end:
            start, end = end, start

        if kind not in ("room", "ride"):
            kind = ""

        return kind, site, status, start, end

    # ---------------- routes ----------------

    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path
        params = parse_qs(parsed.query)

        if route in ("/", "/index.html"):
            self._serve_page()
            return

        # The page itself is public -- it is just the shell, and it
        # renders the sign-in form when this endpoint says nobody is
        # signed in. Every route that touches data is behind the gate
        # below.
        if route == "/api/session":
            session = read_session(self._cookie_token())

            self._json(200, {
                "authenticated": bool(session),
                "admin": {
                    "name": session["name"],
                    "email": session["email"],
                    "site": session["site"],
                } if session else None,
            })
            return

        if not self._require_session():
            return

        try:
            if route == "/api/bootstrap":
                self._json(200, {
                    "default_password": DEFAULT_PASSWORD,
                    "login_url": login_url(),
                    "from_email": settings.SMTP_FROM_EMAIL,
                    "password_expiry_days": settings.PASSWORD_EXPIRY_DAYS,
                    "statuses": STATUSES,
                    "sites": self._sites(),
                    "room_states": ROOM_STATES,
                    "audit_actions": [
                        {"value": action, "label": label}
                        for action, label in AUDIT_ACTIONS.items()
                    ],
                    "audit_outcomes": AUDIT_OUTCOMES,
                    "today": date.today().isoformat(),
                })
                return

            if route == "/api/admins":
                self._json(200, {"admins": list_admins()})
                return

            if route == "/api/bookings":
                kind, site, status, start, end = self._filters(params)

                rows = fetch_bookings(
                    kind=kind,
                    site=site,
                    status=status,
                    start=start,
                    end=end,
                )

                self._json(200, {
                    "bookings": rows[:1000],
                    "count": len(rows),
                    "truncated": len(rows) > 1000,
                })
                return

            if route == "/api/rooms":
                site, state = self._room_filters(params)

                self._json(200, list_rooms(site=site, state=state))
                return

            if route == "/api/audit":
                action, outcome, actor, site, search, start, end = (
                    self._audit_filters(params)
                )

                self._json(200, {
                    **fetch_audit_logs(
                        action=action,
                        outcome=outcome,
                        actor=actor,
                        site=site,
                        search=search,
                        start=start,
                        end=end,
                    ),
                    "range": {"from": start.isoformat(), "to": end.isoformat()},
                })
                return

            if route == "/api/analytics":
                kind, site, status, start, end = self._filters(params)

                rows = fetch_bookings(
                    kind=kind,
                    site=site,
                    status=status,
                    start=start,
                    end=end,
                )

                self._json(200, build_analytics(rows, start, end))
                return

        except Exception as error:
            self._json(500, {"detail": str(error)})
            return

        self._json(404, {"detail": "Not found."})

    def do_POST(self):
        route = urlparse(self.path).path

        try:
            payload = self._body()

            if route == "/api/login":
                try:
                    admin = authenticate(
                        payload.get("email", ""),
                        payload.get("password", ""),
                    )

                except ValueError as error:
                    # Slow every refusal down equally, so failures
                    # cannot be told apart by how fast they come back
                    # and so guessing in bulk is not worth the wait.
                    time.sleep(0.6)

                    # The attempted address is recorded, never the
                    # attempted password -- an audit log that stores
                    # the passwords people typed is a liability, not
                    # a record.
                    record_audit(
                        None,
                        "session.login_failed",
                        outcome="blocked",
                        target_type="admin",
                        target_label=str(payload.get("email", "")).strip()[:255],
                        detail=str(error),
                        source="panel",
                        ip_address=self._client_ip(),
                    )

                    self._json(401, {"detail": str(error)})
                    return

                token = open_session(admin)

                record_audit(
                    {
                        "admin_id": admin.id,
                        "name": admin.name,
                        "email": admin.email,
                    },
                    "session.login",
                    target_type="admin",
                    target_id=admin.id,
                    target_label=admin.name,
                    site=admin.site,
                    source="panel",
                    ip_address=self._client_ip(),
                )

                body = json.dumps({
                    "authenticated": True,
                    "admin": {
                        "name": admin.name,
                        "email": admin.email,
                        "site": admin.site,
                    },
                }).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self._set_cookie(token)
                self.end_headers()
                self.wfile.write(body)
                return

            if route == "/api/logout":
                leaving = read_session(self._cookie_token())

                if leaving:
                    self._audit(
                        leaving,
                        "session.logout",
                        target_type="admin",
                        target_id=leaving["admin_id"],
                        target_label=leaving["name"],
                        site=leaving["site"],
                    )

                close_session(self._cookie_token())

                body = json.dumps({"authenticated": False}).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self._set_cookie(None)
                self.end_headers()
                self.wfile.write(body)
                return

            session = self._require_session()

            if not session:
                return

            if route == "/api/admins/access":
                target = int(payload.get("id"))

                # Revoking your own access mid-session is an easy way
                # to shut yourself out by accident, so it is refused
                # rather than merely warned about.
                granted = bool(payload.get("overall_access"))
                action = "admin.grant_access" if granted else "admin.revoke_access"

                if target == session["admin_id"] and not granted:
                    self._audit(
                        session,
                        action,
                        outcome="blocked",
                        target_type="admin",
                        target_id=target,
                        target_label=session["name"],
                        site=session["site"],
                        detail="Refused: an admin cannot revoke their own panel access.",
                    )

                    self._json(400, {
                        "detail": "You cannot revoke your own panel access.",
                    })
                    return

                try:
                    result = set_overall_access(target, granted)

                except ValueError as error:
                    self._audit(
                        session,
                        action,
                        outcome="blocked",
                        target_type="admin",
                        target_id=target,
                        detail=str(error),
                    )
                    raise

                self._audit(
                    session,
                    action,
                    target_type="admin",
                    target_id=target,
                    target_label=result["admin"]["name"],
                    site=result["admin"]["site"],
                    detail=result["message"],
                )

                self._json(200, result)
                return

            if route == "/api/admins":
                entries = payload.get("admins")

                if not isinstance(entries, list) or not entries:
                    self._json(400, {"detail": "Add at least one admin."})
                    return

                results = seed_admins(entries)

                # One line per account rather than one per batch:
                # a batch where three of five were skipped should
                # read as three skips, not as one ambiguous entry.
                for result in results:
                    self._audit(
                        session,
                        "admin.create",
                        outcome="success" if result["created"] else "blocked",
                        target_type="admin",
                        target_label=f"{result['name']} <{result['email']}>",
                        site=result["site"],
                        detail=result["message"],
                    )

                self._json(200, {"results": results})
                return

            if route == "/api/admins/reset":
                target = int(payload.get("id"))

                result = reset_password(target, payload.get("password", ""))

                # Whether a password was typed in or left to the
                # default is worth knowing later; the password
                # itself is never recorded either way.
                chosen = (
                    "a typed password"
                    if str(payload.get("password", "")).strip()
                    else "the default password"
                )

                self._audit(
                    session,
                    "admin.reset_password",
                    target_type="admin",
                    target_id=target,
                    target_label=f"{result['name']} <{result['email']}>",
                    detail=(
                        f"Reset to {chosen}. "
                        + ("Emailed." if result["emailed"] else "Email failed.")
                    ),
                )

                self._json(200, result)
                return

            if route == "/api/admins/status":
                target = int(payload.get("id"))
                is_active = bool(payload.get("is_active"))
                action = "admin.activate" if is_active else "admin.deactivate"

                try:
                    result = set_admin_active(target, is_active)

                except ValueError as error:
                    self._audit(
                        session,
                        action,
                        outcome="blocked",
                        target_type="admin",
                        target_id=target,
                        detail=str(error),
                    )
                    raise

                self._audit(
                    session,
                    action,
                    target_type="admin",
                    target_id=target,
                    target_label=result["admin"]["name"],
                    site=result["admin"]["site"],
                    detail=result["message"],
                )

                self._json(200, result)
                return

            if route == "/api/admins/delete":
                target = int(payload.get("id"))
                forced = bool(payload.get("force"))

                # Read the name before the row is gone, so the log
                # line does not just say "admin 14".
                doomed = next(
                    (row for row in list_admins() if row["id"] == target),
                    None,
                )

                label = (
                    f"{doomed['name']} <{doomed['email']}>"
                    if doomed
                    else str(target)
                )

                try:
                    result = delete_admin(target, forced)

                except ValueError as error:
                    self._audit(
                        session,
                        "admin.delete",
                        outcome="blocked",
                        target_type="admin",
                        target_id=target,
                        target_label=label,
                        site=(doomed or {}).get("site", ""),
                        detail=str(error),
                    )
                    raise

                # A first attempt that comes back asking for
                # confirmation has not deleted anything yet; it is
                # logged as blocked so the trail shows the pause.
                self._audit(
                    session,
                    "admin.delete",
                    outcome="success" if result["deleted"] else "blocked",
                    target_type="admin",
                    target_id=target,
                    target_label=label,
                    site=(doomed or {}).get("site", ""),
                    detail=(
                        result["message"]
                        + (
                            " Approver cleared from "
                            f"{result['references']['total']} booking(s)."
                            if result["deleted"] and result["references"]["total"]
                            else ""
                        )
                    ),
                )

                self._json(200, result)
                return

            if route == "/api/rooms":
                site_name = str(payload.get("site", "")).strip()

                try:
                    result = create_room(
                        payload.get("room_code", ""),
                        payload.get("room_name", ""),
                        payload.get("capacity", 0),
                        payload.get("location", ""),
                        site_name,
                    )

                except ValueError as error:
                    self._audit(
                        session,
                        "room.create",
                        outcome="blocked",
                        target_type="room",
                        target_label=str(payload.get("room_name", "")).strip()[:255],
                        site=site_name,
                        detail=str(error),
                    )
                    raise

                room = result["room"]

                self._audit(
                    session,
                    "room.create",
                    target_type="room",
                    target_id=room["id"],
                    target_label=f"{room['room_name']} ({room['room_code']})",
                    site=room["site"],
                    detail=(
                        f"Capacity {room['capacity']}"
                        + (f", {room['location']}" if room["location"] else "")
                    ),
                )

                self._json(200, result)
                return

            if route == "/api/rooms/status":
                target = int(payload.get("id"))
                is_active = bool(payload.get("is_active"))
                action = "room.enable" if is_active else "room.disable"

                try:
                    result = set_room_active(target, is_active)

                except ValueError as error:
                    self._audit(
                        session,
                        action,
                        outcome="blocked",
                        target_type="room",
                        target_id=target,
                        detail=str(error),
                    )
                    raise

                room = result["room"]

                self._audit(
                    session,
                    action,
                    target_type="room",
                    target_id=target,
                    target_label=f"{room['room_name']} ({room['room_code']})",
                    site=room["site"],
                    detail=result["message"],
                )

                self._json(200, result)
                return

            if route == "/api/rooms/delete":
                target = int(payload.get("id"))

                try:
                    result = delete_room(target)

                except ValueError as error:
                    self._audit(
                        session,
                        "room.delete",
                        outcome="blocked",
                        target_type="room",
                        target_id=target,
                        target_label=str(payload.get("label", "")).strip()[:255],
                        detail=str(error),
                    )
                    raise

                self._audit(
                    session,
                    "room.delete",
                    target_type="room",
                    target_id=target,
                    target_label=f"{result['room_name']} ({result['room_code']})",
                    site=result["site"],
                    detail=result["message"],
                )

                self._json(200, result)
                return

        except ValueError as error:
            self._json(400, {"detail": str(error)})
            return

        except Exception as error:
            self._json(500, {"detail": str(error)})
            return

        self._json(404, {"detail": "Not found."})

    # ---------------- helpers ----------------

    def _sites(self):
        try:
            return active_site_names()

        except Exception:
            # A dead database must not blank the filters; the site
            # field falls back to free text in the page.
            return []

    def _serve_page(self):
        try:
            body = PAGE_PATH.read_bytes()

        except OSError:
            self._json(500, {"detail": f"Could not read {PAGE_PATH}."})
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stdout.write(f"  {self.address_string()} - {fmt % args}\n")


def serve(host: str, port: int):
    if not PAGE_PATH.exists():
        print(f"Missing panel file: {PAGE_PATH}")
        return

    ensure_overall_access_column()
    ensure_audit_log_table()

    db = SessionLocal()

    try:
        holders = (
            db.query(Admin)
            .filter(Admin.overall_access == 1)
            .filter(Admin.is_active == True)
            .order_by(Admin.email)
            .all()
        )

        emails = [admin.email for admin in holders]

    finally:
        db.close()

    if host not in ("127.0.0.1", "localhost"):
        print(
            f"WARNING: binding to {host} exposes this panel beyond this "
            "machine. It manages admins for every site; keep it on "
            "127.0.0.1 and tunnel in if you need it remotely.\n"
        )

    httpd = ThreadingHTTPServer((host, port), ControlPanelHandler)

    print("Equibook control panel")
    print(f"Open http://{host}:{port} in your browser.")

    if emails:
        print(f"Sign in as: {', '.join(emails)}")

    else:
        print(
            "\nNo admin has control panel access yet, so nobody can sign "
            "in.\nGrant the first one with:\n"
            "    python -m scripts.seed_admin --grant you@equicomservices.com"
        )

    print("\nPress Ctrl+C to stop.\n")

    try:
        httpd.serve_forever()

    except KeyboardInterrupt:
        print("\nStopped.")

    finally:
        httpd.server_close()


# ==============================================================
# CLI
# ==============================================================

def print_results(results: list[dict]):
    for result in results:
        mark = "OK  " if result["created"] else "SKIP"

        print(f"[{mark}] {result['name']} <{result['email']}> ({result['site']})")
        print(f"       {result['message']}")

    created = sum(1 for result in results if result["created"])
    emailed = sum(1 for result in results if result["emailed"])

    print(
        f"\n{created} of {len(results)} account(s) created, "
        f"{emailed} credential email(s) sent."
    )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Equibook control panel: admins, bookings, analytics, rooms "
            "and audit logs. Sign-in needs an admin with "
            "overall_access = 1 (see --grant)."
        )
    )

    parser.add_argument(
        "--seed",
        action="store_true",
        help="Skip the panel and seed the ADMINS list in this file.",
    )

    parser.add_argument(
        "--serve",
        action="store_true",
        help="Open the control panel (the default).",
    )

    parser.add_argument(
        "--grant",
        metavar="EMAIL",
        help="Let that admin sign in to the control panel, then exit.",
    )

    parser.add_argument(
        "--revoke",
        metavar="EMAIL",
        help="Take that admin's control panel access away, then exit.",
    )

    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind (default: 127.0.0.1). Keep it local.",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=8091,
        help="Port to bind (default: 8091).",
    )

    args = parser.parse_args()

    if args.grant or args.revoke:
        ensure_overall_access_column()
        ensure_audit_log_table()

        email = args.grant or args.revoke
        granted = bool(args.grant)

        try:
            message = grant_by_email(email, granted)
            print(message)
            outcome = "success"

        except ValueError as error:
            message = str(error)
            print(message)
            outcome = "blocked"

        # Recorded with no actor: whoever ran this had a shell on
        # the machine, which is not an identity the panel can put a
        # name to. The source column says where it came from.
        record_audit(
            SHELL_ACTOR,
            "admin.grant_access" if granted else "admin.revoke_access",
            outcome=outcome,
            target_type="admin",
            target_label=email,
            detail=message,
            source="shell",
        )

        return

    if args.seed:
        ensure_audit_log_table()

        results = seed_admins(ADMINS)

        for result in results:
            record_audit(
                SHELL_ACTOR,
                "admin.create",
                outcome="success" if result["created"] else "blocked",
                target_type="admin",
                target_label=f"{result['name']} <{result['email']}>",
                site=result["site"],
                detail=result["message"],
                source="shell",
            )

        print_results(results)
        return

    serve(args.host, args.port)


if __name__ == "__main__":
    main()
