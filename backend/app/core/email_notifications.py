"""
Record every email the API dispatches so the UI can confirm it.

Notification emails are handed to FastAPI ``BackgroundTasks`` and
therefore leave *after* the response is built, so a router cannot
put "an email went out" into a body it has already returned.
Instead every dispatch is appended to a per-request list, and the
middleware in ``main.py`` writes that list to the ``EMAIL_HEADER``
response header. The frontend turns the header into a toast.

The list lives in a ContextVar rather than ``request.state`` so
that routers do not have to grow a ``Request`` parameter just to
send an email: ``queue_email`` needs nothing the routers do not
already have.

The header says an email was *dispatched*, not that the SMTP relay
accepted it - the background task has not run yet at that point.
A relay failure is logged by ``send_email`` and does not reach the
toast.

Who was emailed is only ever told to a signed-in admin. Employees
book without logging in, and the recipients of one booking's
emails are other people: the site's admins, and - when an approval
auto-rejects overlapping requests - other employees. So a request
that does not carry an admin token gets a bare "an email was sent"
marker instead, and the addresses never leave the server.
"""

import json
from contextvars import ContextVar

from fastapi import BackgroundTasks, Request

from app.core.security import decode_access_token
from app.services.email_service import send_email


EMAIL_HEADER = "X-Equibook-Emails"

# What everyone who is not a signed-in admin is told: an email
# went out, and nothing about who received it or what it said.
PUBLIC_VALUE = "sent"

# Header values have to stay small: proxies cap the whole header
# block (commonly 8 KB), and an approval can fan out to every
# overlapping requester at once. Long recipient lists are trimmed
# to a sample, and the full count is kept alongside.
MAX_LISTED_RECIPIENTS = 4
MAX_RECORDS = 20
MAX_HEADER_LENGTH = 3000


_dispatched: ContextVar[list[dict] | None] = ContextVar(
    "equibook_dispatched_emails",
    default=None,
)


def start_recording() -> list[dict]:
    """
    Open a fresh record for the request being handled.

    Returns the list the middleware should read once the router
    is done. ``BaseHTTPMiddleware`` runs the route in a child
    task, which copies the context - but the copy points at this
    same list object, so appends made downstream are visible here.
    """
    records: list[dict] = []

    _dispatched.set(records)

    return records


def queue_email(
    background_tasks: BackgroundTasks,
    recipients: list[str],
    subject: str,
    html_body: str,
    *,
    event: str,
):
    """
    Send an email in the background and record it for the UI.

    Drop-in replacement for
    ``background_tasks.add_task(send_email, ...)``; ``event`` is
    the short phrase the toast shows, e.g. "Approval sent".
    """
    background_tasks.add_task(
        send_email,
        recipients,
        subject,
        html_body,
    )

    records = _dispatched.get()

    # No record open means the call came from outside the HTTP
    # middleware (a script, a test). The email still goes out.
    if records is None:
        return

    if len(records) >= MAX_RECORDS:
        return

    records.append(
        {
            "event": event,
            "recipients": list(
                recipients[:MAX_LISTED_RECIPIENTS]
            ),
            "count": len(recipients),
        }
    )


def is_admin_request(request: Request) -> bool:
    """
    Whether this caller is a signed-in admin.

    Only the admin token carries ``role: "admin"``; the booking
    access tokens the requester self-service pages use have their
    own scope and deliberately do not qualify. Nothing is granted
    here - this only decides how much the toast is told - so the
    routers' own dependencies remain the real check.
    """
    authorization = request.headers.get("authorization", "")

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return False

    payload = decode_access_token(token)

    return bool(payload) and payload.get("role") == "admin"


def header_value(
    records: list[dict],
    *,
    detailed: bool,
) -> str | None:
    """
    Serialise the record for the response header.

    Without ``detailed`` the value is the bare marker, so the
    employee booking pages can confirm that an email was sent
    without naming recipients or counting them.

    ``json.dumps`` escapes non-ASCII by default, which also keeps
    the value latin-1 safe the way the HTTP spec wants. Recipient
    addresses are the first thing dropped if the value runs long,
    since the event and the count still make a useful toast.
    """
    if not records:
        return None

    if not detailed:
        return PUBLIC_VALUE

    payload = json.dumps(records, separators=(",", ":"))

    if len(payload) <= MAX_HEADER_LENGTH:
        return payload

    payload = json.dumps(
        [
            {
                "event": record["event"],
                "recipients": [],
                "count": record["count"],
            }
            for record in records
        ],
        separators=(",", ":"),
    )

    if len(payload) <= MAX_HEADER_LENGTH:
        return payload

    return json.dumps(
        [
            {
                "event": "Notification emails sent",
                "recipients": [],
                "count": sum(
                    record["count"] for record in records
                ),
            }
        ],
        separators=(",", ":"),
    )
