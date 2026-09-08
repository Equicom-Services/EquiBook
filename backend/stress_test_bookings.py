"""
Stress-test seeder: mass room + ride bookings across every site.

Purpose
-------
Populate the room and ride tables with a realistic volume of rows so the
list / calendar endpoints and the admin dashboard can be exercised under
load (see the growth analysis: /active and the admin list fetch the whole
history, so this is what actually stresses them).

Usage
-----
    source .venv/bin/activate            # or use ./venv/bin/python
    python stress_test_bookings.py       # mass-seed every active site
    python stress_test_bookings.py --purge   # remove everything this seeder made

A normal seed run first purges any previous stress-test rows, so the
totals are deterministic no matter how many times you run it.

Safety
------
Every seeded row is tagged with the requester email domain
``@stresstest.local``. That tag is the only thing --purge (and the
clean-slate step) deletes, so it can never touch real bookings.
"""

from __future__ import annotations

import argparse
import random
import sys
import time as timer
from datetime import date, datetime, time, timedelta

from app.core.database import SessionLocal

# Import every model so SQLAlchemy can resolve the cross-table
# foreign keys (ride -> admin, ride -> sites, room -> rooms) when it
# configures the mappers. Admin is referenced by approved_rejected_by.
from app.models.admin import Admin  # noqa: F401
from app.models.ride_reservation import RideReservation
from app.models.room import Room
from app.models.room_request import RoomRequest
from app.models.site import Site


# ============================================================
# CONFIGURATION
# ============================================================

ROOM_BOOKINGS_PER_SITE = 200
RIDE_BOOKINGS_PER_SITE = 150

# Spread across several months so the calendar has volume in more
# than one month view.
DATE_START = date(2026, 8, 1)
DATE_END = date(2026, 12, 31)

# The tag that marks a row as belonging to this seeder.
STRESS_EMAIL_DOMAIN = "@stresstest.local"

# Deterministic run, so repeated seeds look the same.
RANDOM_SEED = 20260907
random.seed(RANDOM_SEED)


# ============================================================
# SAMPLE DATA
# ============================================================

EMPLOYEES = [
    "Juan Dela Cruz",
    "Maria Santos",
    "Pedro Reyes",
    "Ana Garcia",
    "John Michael Cruz",
    "Angela Flores",
    "Mark Villanueva",
    "Christine Ramos",
    "Kevin Bautista",
    "Sofia Mendoza",
    "Daniel Aquino",
    "Patricia Navarro",
    "Ryan Torres",
    "Michelle Castillo",
    "Carlo Fernandez",
]

ROOM_PURPOSES = [
    "Team meeting",
    "Project discussion",
    "Client meeting",
    "Training session",
    "Weekly sync",
    "Department meeting",
    "Planning session",
    "Interview",
    "Presentation",
    "Workshop",
    "Management review",
    "Technical discussion",
]

RIDE_PURPOSES = [
    "Client meeting",
    "Site visit",
    "Business meeting",
    "Official business",
    "Employee transport",
    "Project visit",
    "Field work",
    "Company event",
    "Training",
    "Customer visit",
]

PICKUP_LOCATIONS = [
    "SM Mall of Asia",
    "Makati CBD",
    "BGC",
    "Quezon City",
    "Pasay City",
    "NAIA Terminal 3",
    "Ortigas Center",
    "Alabang",
    "Pasig City",
    "Mandaluyong",
]

DROPOFF_LOCATIONS = [
    "Client Office",
    "Corporate Headquarters",
    "Training Center",
    "Conference Center",
    "Regional Branch",
    "Supplier Warehouse",
]

# Matches the vehicle options offered in the admin ride form.
VEHICLE_TYPES = ["Company Car", "TNVS"]

# Weighted so most rows are APPROVED/PENDING (what /active and the
# calendar return), with some finished rows for the admin list.
STATUS_CHOICES = ["APPROVED", "PENDING", "REJECTED", "CANCELLED"]
STATUS_WEIGHTS = [55, 25, 12, 8]


# ============================================================
# HELPERS
# ============================================================

def stress_email(name: str) -> str:
    slug = name.lower().replace(" ", ".")
    return f"{slug}{STRESS_EMAIL_DOMAIN}"


def random_date() -> date:
    span = (DATE_END - DATE_START).days
    return DATE_START + timedelta(days=random.randint(0, span))


def random_room_times() -> tuple[time, time, int]:
    """A realistic start/end plus duration in minutes."""
    start_hour = random.randint(8, 16)
    start_minute = random.choice([0, 30])
    duration = random.choice([30, 60, 90, 120, 180])

    start_dt = datetime(2026, 1, 1, start_hour, start_minute)
    end_dt = start_dt + timedelta(minutes=duration)

    return start_dt.time(), end_dt.time(), duration


def random_request_datetime(reservation_day: date) -> datetime:
    """A request made a little before the reservation/travel date."""
    return datetime.combine(
        reservation_day - timedelta(days=random.randint(1, 14)),
        time(random.randint(8, 17), random.choice([0, 15, 30, 45])),
    )


def random_status() -> str:
    return random.choices(
        STATUS_CHOICES, weights=STATUS_WEIGHTS, k=1
    )[0]


def admin_remarks_for(status: str) -> str | None:
    return {
        "APPROVED": "Reservation approved.",
        "REJECTED": "Reservation rejected.",
        "CANCELLED": "Reservation cancelled.",
    }.get(status)


# ============================================================
# SEED ONE SITE
# ============================================================

def seed_rooms_for_site(db, site, room_ids: list[int]) -> int:
    for _ in range(ROOM_BOOKINGS_PER_SITE):
        name = random.choice(EMPLOYEES)
        reservation_date = random_date()
        start_time, end_time, duration = random_room_times()
        status = random_status()
        request_dt = random_request_datetime(reservation_date)
        acted = status != "PENDING"

        db.add(
            RoomRequest(
                request_date_time=request_dt,
                room_id=random.choice(room_ids),
                employee_name=name,
                employee_email=stress_email(name),
                reservation_date=reservation_date,
                start_time=start_time,
                end_time=end_time,
                duration_minutes=duration,
                purpose=random.choice(ROOM_PURPOSES),
                status=status,
                admin_remarks=admin_remarks_for(status),
                approved_rejected_by=None,
                approved_rejected_date_time=request_dt if acted else None,
                calendar_event_id=None,
                created_at=request_dt,
                updated_at=request_dt,
            )
        )

    return ROOM_BOOKINGS_PER_SITE


def seed_rides_for_site(db, site) -> int:
    for _ in range(RIDE_BOOKINGS_PER_SITE):
        name = random.choice(EMPLOYEES)
        travel_date = random_date()
        departure_time = time(
            random.randint(6, 18), random.choice([0, 15, 30, 45])
        )
        roundtrip = random.random() < 0.35
        status = random_status()
        request_dt = random_request_datetime(travel_date)
        acted = status != "PENDING"

        return_pickup = None
        return_dropoff = None
        if roundtrip:
            return_pickup = datetime.combine(
                travel_date,
                time(
                    random.randint(15, 20),
                    random.choice([0, 15, 30, 45]),
                ),
            )
            return_dropoff = random.choice(PICKUP_LOCATIONS)

        db.add(
            RideReservation(
                request_date_time=request_dt,
                employee_name=name,
                employee_email=stress_email(name),
                site_id=site.site_id,
                site=site.site_name,
                travel_date=travel_date,
                departure_time=departure_time,
                roundtrip=roundtrip,
                return_pickup=return_pickup,
                pickup_location=random.choice(PICKUP_LOCATIONS),
                pickup_maps_link=None,
                dropoff_destination=random.choice(DROPOFF_LOCATIONS),
                drop_off_maps_link=None,
                return_drop_off_location=return_dropoff,
                return_drop_off_maps_link=None,
                purpose=random.choice(RIDE_PURPOSES),
                passenger_count=random.randint(1, 8),
                vehicle_type=(
                    random.choice(VEHICLE_TYPES) if acted else None
                ),
                status=status,
                admin_remarks=admin_remarks_for(status),
                approved_rejected_by=None,
                approved_rejected_date_time=request_dt if acted else None,
                calendar_event_id=None,
                created_at=request_dt,
                updated_at=request_dt,
            )
        )

    return RIDE_BOOKINGS_PER_SITE


# ============================================================
# SEED
# ============================================================

def seed(db) -> None:
    sites = (
        db.query(Site)
        .filter(Site.is_active == True)
        .order_by(Site.site_id)
        .all()
    )

    if not sites:
        sys.exit("No active sites found.")

    # Clean slate so repeated runs give deterministic totals.
    removed = purge(db, announce=False)
    if removed:
        print(f"Cleared {removed} previous stress-test row(s).")

    print(
        f"Mass-seeding {len(sites)} site(s): "
        f"{ROOM_BOOKINGS_PER_SITE} rooms + "
        f"{RIDE_BOOKINGS_PER_SITE} rides each..."
    )

    started = timer.perf_counter()
    total_rooms = 0
    total_rides = 0

    for site in sites:
        room_ids = [
            room.room_id
            for room in (
                db.query(Room)
                .filter(
                    Room.site_id == site.site_id,
                    Room.is_active == True,
                )
                .all()
            )
        ]

        if room_ids:
            total_rooms += seed_rooms_for_site(db, site, room_ids)
            room_note = f"{ROOM_BOOKINGS_PER_SITE} rooms"
        else:
            room_note = "0 rooms (no active room)"

        total_rides += seed_rides_for_site(db, site)

        print(f"  {site.site_name:<12} {room_note}, {RIDE_BOOKINGS_PER_SITE} rides")

    db.commit()

    elapsed = timer.perf_counter() - started

    print(
        f"\nDone in {elapsed:.2f}s. "
        f"Inserted {total_rooms} room + {total_rides} ride "
        f"= {total_rooms + total_rides} rows."
    )

    room_total = db.query(RoomRequest).count()
    ride_total = db.query(RideReservation).count()
    print(
        f"Table totals now: room_reservation_request={room_total}, "
        f"ride_reservation_request={ride_total}"
    )


# ============================================================
# PURGE
# ============================================================

def purge(db, announce: bool = True) -> int:
    like = f"%{STRESS_EMAIL_DOMAIN}"

    rooms_deleted = (
        db.query(RoomRequest)
        .filter(RoomRequest.employee_email.like(like))
        .delete(synchronize_session=False)
    )

    rides_deleted = (
        db.query(RideReservation)
        .filter(RideReservation.employee_email.like(like))
        .delete(synchronize_session=False)
    )

    db.commit()

    total = rooms_deleted + rides_deleted

    if announce:
        print(
            f"Purged {total} stress-test row(s) "
            f"({rooms_deleted} room, {rides_deleted} ride)."
        )

    return total


# ============================================================
# ENTRY POINT
# ============================================================

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mass-seed or purge stress-test bookings across all sites."
    )
    parser.add_argument(
        "--purge",
        action="store_true",
        help="Delete every booking this seeder created, then exit.",
    )

    args = parser.parse_args()

    db = SessionLocal()

    try:
        if args.purge:
            purge(db)
        else:
            seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
