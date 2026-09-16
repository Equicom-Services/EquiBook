from __future__ import annotations

"""
Seed ride_reservation_request from the legacy Google-Sheets export.

Companion to seed_reservations_csv.py, for the transport side. The
exported "Reservation ID" is dropped -- ride_reservation_id is left to
MySQL's AUTO_INCREMENT so seeded rows share one id sequence with
everything the live API creates.

Usage:
    python seed_rides_csv.py --dry-run     # report only, no writes
    python seed_rides_csv.py               # insert
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
    / "Transportation Reservation System - TRANSPORT_REQUESTS.csv"
)


# The export writes title-case statuses; the app compares against
# upper-case ones everywhere (see routers/ride_reservations.py).
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

def load_sites(connection) -> dict[str, int]:
    """
    Map site_name -> site_id. Rides store both: site_id as the FK and
    site as the plain string the admin scoping filter reads.
    """

    result = connection.execute(
        text("SELECT site_id, site_name FROM sites")
    )

    return {
        row.site_name.strip().lower(): row.site_id
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
    Fingerprint of every ride already in the table, so re-running this
    script doesn't duplicate rows.
    """

    result = connection.execute(
        text(
            """
            SELECT
                request_date_time,
                employee_email,
                travel_date,
                departure_time,
                dropoff_destination
            FROM ride_reservation_request
            """
        )
    )

    return {
        (
            row.request_date_time,
            (row.employee_email or "").strip().lower(),
            row.travel_date,
            row.departure_time,
            (row.dropoff_destination or "").strip().lower(),
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

    value = (value or "").strip()

    if not value:
        return None

    return datetime.strptime(value, "%I:%M %p").time()


def blank_to_none(value: str) -> str | None:
    return (value or "").strip() or None


def build_row(
    record: dict,
    sites: dict[str, int],
    admins: dict[str, int],
) -> tuple[dict | None, str | None]:
    """
    Turn one CSV record into insert parameters.

    Returns (params, error). Exactly one of the two is None.
    """

    site_name = (record["Site"] or "").strip()

    site_id = sites.get(site_name.lower())

    if site_id is None:
        return None, f"unknown site {site_name!r}"

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

    travel_date = parse_date(record["Travel Date"])

    roundtrip = (
        record["Round Trip"] or ""
    ).strip().upper() == "TRUE"

    # The export stores the return pickup as a bare time, but the model
    # wants a datetime. Every round trip in the data returns the same
    # day, so pin it to the travel date.
    return_pickup_time = parse_time(record["Return Pickup Time"])

    return_pickup = (
        datetime.combine(travel_date, return_pickup_time)
        if return_pickup_time is not None
        else None
    )

    request_date_time = parse_datetime(record["Request DateTime"])

    updated_at = (
        parse_datetime(record["Last Updated DateTime"])
        or request_date_time
    )

    return {
        "request_date_time": request_date_time,
        "employee_name": (record["Employee Name"] or "").strip(),
        "employee_email": (record["Employee Email"] or "").strip(),
        "site_id": site_id,
        "site": site_name,
        "travel_date": travel_date,
        "departure_time": parse_time(record["Departure Time"]),
        "roundtrip": roundtrip,
        "return_pickup": return_pickup,
        "pickup_location": (record["Pickup Location"] or "").strip(),
        "pickup_maps_link": blank_to_none(record["Pickup Maps Link"]),
        "dropoff_destination": (record["Drop Off Destination"] or "").strip(),
        "drop_off_maps_link": blank_to_none(record["Drop Off Maps Link"]),
        "return_drop_off_location": blank_to_none(
            record["Return Drop Off Location"]
        ),
        "return_drop_off_maps_link": blank_to_none(
            record["Return Drop Off Maps Link"]
        ),
        "purpose": (record["Purpose"] or "").strip(),
        "passenger_count": int(record["Passengers"]),
        "vehicle_type": blank_to_none(record["Vehicle Type"]),
        "status": status,
        "admin_remarks": blank_to_none(record["Admin Remarks"]),
        "approved_rejected_by": approved_rejected_by,
        "approved_rejected_date_time": parse_datetime(
            record["Approved/Rejected DateTime"]
        ),
        "calendar_event_id": blank_to_none(record["Calendar Event ID"]),
        "created_at": request_date_time,
        "updated_at": updated_at,
    }, None


def fingerprint(params: dict) -> tuple:
    return (
        params["request_date_time"],
        params["employee_email"].lower(),
        params["travel_date"],
        params["departure_time"],
        params["dropoff_destination"].lower(),
    )


# ============================================================
# INSERT
# ============================================================

INSERT_SQL = text(
    """
    INSERT INTO ride_reservation_request (
        request_date_time,
        employee_name,
        employee_email,
        site_id,
        site,
        travel_date,
        departure_time,
        roundtrip,
        return_pickup,
        pickup_location,
        pickup_maps_link,
        dropoff_destination,
        drop_off_maps_link,
        return_drop_off_location,
        return_drop_off_maps_link,
        purpose,
        passenger_count,
        vehicle_type,
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
        :employee_name,
        :employee_email,
        :site_id,
        :site,
        :travel_date,
        :departure_time,
        :roundtrip,
        :return_pickup,
        :pickup_location,
        :pickup_maps_link,
        :dropoff_destination,
        :drop_off_maps_link,
        :return_drop_off_location,
        :return_drop_off_maps_link,
        :purpose,
        :passenger_count,
        :vehicle_type,
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
        description="Seed ride reservations from the legacy CSV export."
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
        sites = load_sites(connection)

        admins = load_admins(connection)

        seen = load_existing_keys(connection)

        inserted = 0

        skipped_duplicate = 0

        roundtrips = 0

        errors: list[tuple[str, str]] = []

        for record in records:
            params, error = build_row(record, sites, admins)

            if error is not None:
                errors.append((record.get("Reservation ID", "?"), error))
                continue

            key = fingerprint(params)

            if key in seen:
                skipped_duplicate += 1
                continue

            seen.add(key)

            if params["roundtrip"]:
                roundtrips += 1

            if not args.dry_run:
                connection.execute(INSERT_SQL, params)

            inserted += 1

        if args.dry_run:
            connection.rollback()

    verb = "would insert" if args.dry_run else "inserted"

    print(f"  {verb:<14} {inserted}")
    print(f"  duplicates skipped {skipped_duplicate}")
    print(f"  round trips (return_pickup set) {roundtrips}")

    if errors:
        print(f"  errors {len(errors)}:")

        for reservation_id, message in errors:
            print(f"    {reservation_id}: {message}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
