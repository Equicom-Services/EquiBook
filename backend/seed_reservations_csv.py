from __future__ import annotations

"""
Seed room_reservation_request from the legacy Google-Sheets export.

The old site's export lives in uploads/ as a CSV. This script maps each
exported row onto Equibook's own schema and inserts it. The exported
"Reservation ID" is deliberately dropped -- room_reservation_id is left to
MySQL's AUTO_INCREMENT so the seeded rows share one id sequence with
everything the live API creates.

Usage:
    python seed_reservations_csv.py --dry-run     # report only, no writes
    python seed_reservations_csv.py               # insert
"""

import argparse
import csv
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, text

from app.core.config import settings


# ============================================================
# CONFIGURATION
# ============================================================

CSV_PATH = (
    Path(__file__).parent
    / "uploads"
    / "Room Reservation System - RESERVATIONS.csv"
)


# The export writes title-case statuses; the app compares against
# upper-case ones everywhere (see routers/room_requests.py).
STATUS_MAP = {
    "approved": "APPROVED",
    "rejected": "REJECTED",
    "pending": "PENDING",
    "cancelled": "CANCELLED",
    "canceled": "CANCELLED",
}


# ============================================================
# DATABASE
# ============================================================

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)


# ============================================================
# LOOKUPS
# ============================================================

def load_rooms(connection) -> dict[tuple[str, str], int]:
    """
    Map (site_name, room_code) -> room_id.

    Room codes repeat across sites, so the site has to be part of the
    key -- ROOM-001 is a different room in Zapote than in Legazpi.
    """

    result = connection.execute(
        text(
            """
            SELECT
                r.room_id,
                r.room_code,
                s.site_name
            FROM rooms r
            JOIN sites s
                ON s.site_id = r.site_id
            """
        )
    )

    return {
        (row.site_name.strip().lower(), row.room_code.strip().upper()): row.room_id
        for row in result
    }


def load_admins(connection) -> dict[str, int]:
    """
    Map admin email -> admin id, for approved_rejected_by.
    """

    result = connection.execute(
        text("SELECT id, email FROM admin")
    )

    return {
        row.email.strip().lower(): row.id
        for row in result
    }


def load_existing_keys(connection) -> set[tuple]:
    """
    Fingerprint of every request already in the table, so re-running
    this script doesn't duplicate rows.

    request_date_time is part of the key on purpose: the export
    contains a genuine re-submission (same employee, room, date and
    time, submitted twice minutes apart and rejected twice). Those are
    two real requests and both belong in the table -- only a literal
    re-run of this script should be skipped.
    """

    result = connection.execute(
        text(
            """
            SELECT
                request_date_time,
                room_id,
                reservation_date,
                start_time,
                end_time,
                employee_email,
                purpose
            FROM room_reservation_request
            """
        )
    )

    return {
        (
            row.request_date_time,
            row.room_id,
            row.reservation_date,
            row.start_time,
            row.end_time,
            (row.employee_email or "").strip().lower(),
            (row.purpose or "").strip().lower(),
        )
        for row in result
    }


# ============================================================
# FIELD PARSING
# ============================================================

def parse_datetime(value: str) -> datetime | None:
    value = (value or "").strip()

    if not value:
        return None

    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")


def parse_date(value: str):
    return datetime.strptime(
        (value or "").strip(),
        "%Y-%m-%d",
    ).date()


def parse_time(value: str):
    """
    The export mixes "8:00 AM" and "08:00 AM"; %I handles both.
    """

    return datetime.strptime(
        (value or "").strip(),
        "%I:%M %p",
    ).time()


def primary_email(value: str) -> str:
    """
    Some rows carry the requester plus a cc'd admin in one cell
    ("a@x.com, b@x.com"). employee_email is the *requester*, and the
    combined string also blows past the column's 150 chars, so keep
    the first address only.

    Rows exported with no address at all keep an empty string -- the
    column is NOT NULL and the old site simply never recorded one.
    """

    return (value or "").split(",")[0].strip()


def build_row(
    record: dict,
    rooms: dict[tuple[str, str], int],
    admins: dict[str, int],
) -> tuple[dict | None, str | None]:
    """
    Turn one CSV record into insert parameters.

    Returns (params, error). Exactly one of the two is None.
    """

    site = (record["Site"] or "").strip()

    room_code = (record["Room ID"] or "").strip().upper()

    room_id = rooms.get((site.lower(), room_code))

    if room_id is None:
        return None, f"no room for site={site!r} code={room_code!r}"

    status = STATUS_MAP.get(
        (record["Status"] or "").strip().lower()
    )

    if status is None:
        return None, f"unknown status {record['Status']!r}"

    approver_email = (
        record["Approved/Rejected By"] or ""
    ).strip().lower()

    approved_rejected_by = None

    if approver_email:
        approved_rejected_by = admins.get(approver_email)

        if approved_rejected_by is None:
            return None, f"approver {approver_email!r} is not an admin"

    start_time = parse_time(record["Start Time"])

    end_time = parse_time(record["End Time"])

    # A handful of exported rows carry a stale Duration Minutes (a
    # leftover 480). start/end are what the app's overlap check runs
    # on, so derive the duration from them and let it win.
    duration_minutes = int(
        (
            datetime.combine(parse_date(record["Reservation Date"]), end_time)
            - datetime.combine(parse_date(record["Reservation Date"]), start_time)
        ).total_seconds()
        // 60
    )

    request_date_time = parse_datetime(record["Request DateTime"])

    updated_at = (
        parse_datetime(record["Last Updated DateTime"])
        or request_date_time
    )

    admin_remarks = (record["Admin Remarks"] or "").strip() or None

    calendar_event_id = (
        record["Calendar Event ID"] or ""
    ).strip() or None

    return {
        "request_date_time": request_date_time,
        "room_id": room_id,
        "employee_name": (record["Employee Name"] or "").strip(),
        "employee_email": primary_email(record["Employee Email"]),
        "reservation_date": parse_date(record["Reservation Date"]),
        "start_time": start_time,
        "end_time": end_time,
        "duration_minutes": duration_minutes,
        "purpose": (record["Purpose"] or "").strip(),
        "status": status,
        "admin_remarks": admin_remarks,
        "approved_rejected_by": approved_rejected_by,
        "approved_rejected_date_time": parse_datetime(
            record["Approved/Rejected DateTime"]
        ),
        "calendar_event_id": calendar_event_id,
        "created_at": request_date_time,
        "updated_at": updated_at,
    }, None


def fingerprint(params: dict) -> tuple:
    return (
        params["request_date_time"],
        params["room_id"],
        params["reservation_date"],
        params["start_time"],
        params["end_time"],
        params["employee_email"].lower(),
        params["purpose"].lower(),
    )


# ============================================================
# INSERT
# ============================================================

INSERT_SQL = text(
    """
    INSERT INTO room_reservation_request (
        request_date_time,
        room_id,
        employee_name,
        employee_email,
        reservation_date,
        start_time,
        end_time,
        duration_minutes,
        purpose,
        status,
        admin_remarks,
        approved_rejected_by,
        approved_rejected_date_time,
        calendar_event_id,
        created_at,
        updated_at
    )
    VALUES (
        :request_date_time,
        :room_id,
        :employee_name,
        :employee_email,
        :reservation_date,
        :start_time,
        :end_time,
        :duration_minutes,
        :purpose,
        :status,
        :admin_remarks,
        :approved_rejected_by,
        :approved_rejected_date_time,
        :calendar_event_id,
        :created_at,
        :updated_at
    )
    """
)


# ============================================================
# MAIN
# ============================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed room reservations from the legacy CSV export."
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="parse and report without writing anything",
    )

    parser.add_argument(
        "--csv",
        default=str(CSV_PATH),
        help="path to the export (defaults to the file in uploads/)",
    )

    args = parser.parse_args()

    csv_path = Path(args.csv)

    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return 1

    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        records = list(csv.DictReader(handle))

    print(f"Read {len(records)} rows from {csv_path.name}")

    with engine.begin() as connection:
        rooms = load_rooms(connection)

        admins = load_admins(connection)

        seen = load_existing_keys(connection)

        inserted = 0

        skipped_duplicate = 0

        errors: list[tuple[str, str]] = []

        blank_email = 0

        for record in records:
            params, error = build_row(record, rooms, admins)

            if error is not None:
                errors.append((record.get("Reservation ID", "?"), error))
                continue

            key = fingerprint(params)

            if key in seen:
                skipped_duplicate += 1
                continue

            seen.add(key)

            if not params["employee_email"]:
                blank_email += 1

            if not args.dry_run:
                connection.execute(INSERT_SQL, params)

            inserted += 1

        if args.dry_run:
            connection.rollback()

    verb = "would insert" if args.dry_run else "inserted"

    print(f"  {verb:<14} {inserted}")
    print(f"  duplicates skipped {skipped_duplicate}")
    print(f"  blank employee_email kept as '' : {blank_email}")

    if errors:
        print(f"  errors {len(errors)}:")

        for reservation_id, message in errors:
            print(f"    {reservation_id}: {message}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
