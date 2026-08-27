from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import create_engine, text

from app.core.config import settings


# ============================================================
# CONFIGURATION
# ============================================================

ROOM_BOOKINGS_TO_CREATE = 150
RIDE_BOOKINGS_TO_CREATE = 150

SEPTEMBER_START = date(2026, 9, 1)
SEPTEMBER_END = date(2026, 9, 30)

RANDOM_SEED = 20260901

random.seed(RANDOM_SEED)


# ============================================================
# DATABASE
# ============================================================

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)


# ============================================================
# SAMPLE EMPLOYEES
# ============================================================

EMPLOYEES = [
    ("Juan Dela Cruz", "juan.delacruz@equibook.com"),
    ("Maria Santos", "maria.santos@equibook.com"),
    ("Pedro Reyes", "pedro.reyes@equibook.com"),
    ("Ana Garcia", "ana.garcia@equibook.com"),
    ("John Michael Cruz", "john.cruz@equibook.com"),
    ("Angela Flores", "angela.flores@equibook.com"),
    ("Mark Villanueva", "mark.villanueva@equibook.com"),
    ("Christine Ramos", "christine.ramos@equibook.com"),
    ("Kevin Bautista", "kevin.bautista@equibook.com"),
    ("Sofia Mendoza", "sofia.mendoza@equibook.com"),
    ("Daniel Aquino", "daniel.aquino@equibook.com"),
    ("Patricia Navarro", "patricia.navarro@equibook.com"),
    ("Ryan Torres", "ryan.torres@equibook.com"),
    ("Michelle Castillo", "michelle.castillo@equibook.com"),
    ("Carlo Fernandez", "carlo.fernandez@equibook.com"),
    ("Nicole Ramos", "nicole.ramos@equibook.com"),
    ("James Bautista", "james.bautista@equibook.com"),
    ("Rachel Lim", "rachel.lim@equibook.com"),
    ("Joshua Tan", "joshua.tan@equibook.com"),
    ("Stephanie Ong", "stephanie.ong@equibook.com"),
]


# ============================================================
# ROOM PURPOSES
# ============================================================

ROOM_PURPOSES = [
    "Team meeting",
    "Project discussion",
    "Client meeting",
    "Training session",
    "Weekly meeting",
    "Department meeting",
    "Planning session",
    "Interview",
    "Presentation",
    "Workshop",
    "Management meeting",
    "Technical discussion",
    "Business review",
    "Employee orientation",
]


# ============================================================
# RIDE PURPOSES
# ============================================================

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
    "Operations support",
    "Business development",
]


# ============================================================
# RIDE LOCATIONS
# ============================================================

PICKUP_LOCATIONS = [
    "SM Mall of Asia",
    "Makati CBD",
    "BGC",
    "Quezon City",
    "Pasay City",
    "Manila City Hall",
    "NAIA Terminal 3",
    "Ortigas Center",
    "Alabang",
    "Pasig City",
    "Mandaluyong",
    "Cavite",
]


DROPOFF_LOCATIONS = [
    "Equibook Zapote Office",
    "Equibook Binondo Office",
    "Equibook Legazpi Office",
    "Equibook Cebu Office",
    "Client Office",
    "Corporate Headquarters",
    "Training Center",
    "Conference Center",
]


VEHICLE_TYPES = [
    "Sedan",
    "SUV",
    "Van",
]


# ============================================================
# DATE HELPERS
# ============================================================

def random_september_date() -> date:
    """
    Generate a random date from September 1-30, 2026.
    """

    total_days = (
        SEPTEMBER_END - SEPTEMBER_START
    ).days

    return SEPTEMBER_START + timedelta(
        days=random.randint(0, total_days)
    )


def random_request_datetime() -> datetime:
    """
    Generate a random request datetime during September 2026.
    """

    booking_date = random_september_date()

    return datetime.combine(
        booking_date,
        time(
            hour=random.randint(8, 17),
            minute=random.choice([0, 15, 30, 45]),
            second=random.randint(0, 59),
        ),
    )


# ============================================================
# ROOM TIME HELPERS
# ============================================================

def random_room_times() -> tuple[time, time, int]:
    """
    Generate a realistic room reservation time.

    Returns:
        start_time
        end_time
        duration_minutes
    """

    start_hour = random.randint(8, 16)

    start_minute = random.choice(
        [0, 30]
    )

    duration = random.choice(
        [30, 60, 90, 120, 180]
    )

    start_datetime = datetime(
        2026,
        9,
        1,
        start_hour,
        start_minute,
    )

    end_datetime = (
        start_datetime
        + timedelta(minutes=duration)
    )

    return (
        start_datetime.time(),
        end_datetime.time(),
        duration,
    )


# ============================================================
# RIDE TIME HELPERS
# ============================================================

def random_departure_time() -> time:
    """
    Generate a realistic ride departure time.
    """

    return time(
        hour=random.randint(6, 18),
        minute=random.choice(
            [0, 15, 30, 45]
        ),
    )


# ============================================================
# STATUS
# ============================================================

def get_status_for_site(site_name: str) -> str:
    """
    Status rules:

    Zapote:
        ALL PENDING

    Other sites:
        Mixed PENDING / APPROVED / REJECTED
    """

    if site_name.strip().lower() == "zapote":
        return "PENDING"

    return random.choices(
        [
            "PENDING",
            "APPROVED",
            "REJECTED",
        ],
        weights=[
            40,
            40,
            20,
        ],
        k=1,
    )[0]


# ============================================================
# ADMIN REMARKS
# ============================================================

def get_admin_remarks(status: str) -> str | None:
    if status == "PENDING":
        return None

    if status == "APPROVED":
        return "Reservation approved."

    return "Reservation rejected."


# ============================================================
# CALENDAR EVENT ID
# ============================================================

def get_calendar_event_id(
    reservation_type: str,
    reservation_id: int,
    status: str,
) -> str | None:
    """
    Only approved reservations receive calendar event IDs.
    """

    if status != "APPROVED":
        return None

    return (
        f"seed-{reservation_type}-"
        f"{reservation_id}-"
        f"{random.randint(1000, 9999)}"
    )


# ============================================================
# FETCH SITES
# ============================================================

def get_sites(connection):
    result = connection.execute(
        text(
            """
            SELECT
                site_id,
                site_name
            FROM sites
            WHERE is_active = 1
            ORDER BY site_id
            """
        )
    )

    return result.fetchall()


# ============================================================
# FETCH ROOMS
# ============================================================

def get_rooms(connection):
    result = connection.execute(
        text(
            """
            SELECT
                r.room_id,
                r.room_code,
                r.room_name,
                r.capacity,
                r.site_id,
                s.site_name
            FROM rooms r
            INNER JOIN sites s
                ON s.site_id = r.site_id
            WHERE r.is_active = 1
              AND s.is_active = 1
            ORDER BY r.room_id
            """
        )
    )

    return result.fetchall()


# ============================================================
# INSERT ROOM BOOKING
# ============================================================

def insert_room_booking(
    connection,
    room,
):
    employee_name, employee_email = random.choice(
        EMPLOYEES
    )

    request_datetime = random_request_datetime()

    reservation_date = random_september_date()

    start_time, end_time, duration_minutes = (
        random_room_times()
    )

    status = get_status_for_site(
        room.site_name
    )

    admin_remarks = get_admin_remarks(
        status
    )

    approved_rejected_datetime = (
        request_datetime
        if status in {"APPROVED", "REJECTED"}
        else None
    )

    # Insert first so we can get the auto-generated ID.
    result = connection.execute(
        text(
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
        ),
        {
            "request_date_time": request_datetime,
            "room_id": room.room_id,
            "employee_name": employee_name,
            "employee_email": employee_email,
            "reservation_date": reservation_date,
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": duration_minutes,
            "purpose": random.choice(
                ROOM_PURPOSES
            ),
            "status": status,
            "admin_remarks": admin_remarks,
            "approved_rejected_by": None,
            "approved_rejected_date_time": (
                approved_rejected_datetime
            ),
            "calendar_event_id": None,
            "created_at": request_datetime,
            "updated_at": request_datetime,
        },
    )

    reservation_id = result.lastrowid

    # Add calendar event ID only for approved reservations.
    if status == "APPROVED":
        calendar_event_id = get_calendar_event_id(
            "room",
            reservation_id,
            status,
        )

        connection.execute(
            text(
                """
                UPDATE room_reservation_request
                SET calendar_event_id = :calendar_event_id
                WHERE room_reservation_id = :reservation_id
                """
            ),
            {
                "calendar_event_id": calendar_event_id,
                "reservation_id": reservation_id,
            },
        )

    return status


# ============================================================
# INSERT RIDE BOOKING
# ============================================================

def insert_ride_booking(
    connection,
    site,
):
    employee_name, employee_email = random.choice(
        EMPLOYEES
    )

    request_datetime = random_request_datetime()

    travel_date = random_september_date()

    departure_time = random_departure_time()

    roundtrip = random.choice(
        [
            False,
            False,
            True,
        ]
    )

    return_pickup = None
    return_dropoff = None

    if roundtrip:
        return_pickup = (
            datetime.combine(
                travel_date,
                departure_time,
            )
            + timedelta(
                hours=random.randint(3, 8)
            )
        )

        return_dropoff = random.choice(
            PICKUP_LOCATIONS
        )

    pickup_location = random.choice(
        PICKUP_LOCATIONS
    )

    dropoff_destination = random.choice(
        DROPOFF_LOCATIONS
    )

    status = get_status_for_site(
        site.site_name
    )

    passenger_count = random.randint(
        1,
        6,
    )

    vehicle_type = random.choice(
        VEHICLE_TYPES
    )

    admin_remarks = get_admin_remarks(
        status
    )

    approved_rejected_datetime = (
        request_datetime
        if status in {"APPROVED", "REJECTED"}
        else None
    )

    # Insert first so we can get the auto-generated ID.
    result = connection.execute(
        text(
            """
            INSERT INTO ride_reservation_request (
                request_date_time,
                employee_name,
                employee_email,
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
        ),
        {
            "request_date_time": request_datetime,
            "employee_name": employee_name,
            "employee_email": employee_email,
            "site": site.site_name,
            "travel_date": travel_date,
            "departure_time": departure_time,
            "roundtrip": roundtrip,
            "return_pickup": return_pickup,
            "pickup_location": pickup_location,
            "pickup_maps_link": None,
            "dropoff_destination": dropoff_destination,
            "drop_off_maps_link": None,
            "return_drop_off_location": (
                return_dropoff
                if roundtrip
                else None
            ),
            "return_drop_off_maps_link": None,
            "purpose": random.choice(
                RIDE_PURPOSES
            ),
            "passenger_count": passenger_count,
            "vehicle_type": vehicle_type,
            "status": status,
            "admin_remarks": admin_remarks,
            "approved_rejected_by": None,
            "approved_rejected_date_time": (
                approved_rejected_datetime
            ),
            "calendar_event_id": None,
            "created_at": request_datetime,
            "updated_at": request_datetime,
        },
    )

    reservation_id = result.lastrowid

    # Add calendar event ID only for approved reservations.
    if status == "APPROVED":
        calendar_event_id = get_calendar_event_id(
            "ride",
            reservation_id,
            status,
        )

        connection.execute(
            text(
                """
                UPDATE ride_reservation_request
                SET calendar_event_id = :calendar_event_id
                WHERE ride_reservation_id = :reservation_id
                """
            ),
            {
                "calendar_event_id": calendar_event_id,
                "reservation_id": reservation_id,
            },
        )

    return status


# ============================================================
# PRINT COUNTS
# ============================================================

def print_counts(title: str, counts: dict):
    print()
    print(title)
    print("-" * 60)

    for site_name, site_counts in counts.items():
        print(
            f"{site_name:<12} "
            f"PENDING: {site_counts['PENDING']:<4} "
            f"APPROVED: {site_counts['APPROVED']:<4} "
            f"REJECTED: {site_counts['REJECTED']:<4}"
        )


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("EQUIBOOK BOOKING SEEDER")
    print("=" * 60)

    print()

    print("Booking date range:")
    print("  2026-09-01 -> 2026-09-30")

    print()

    print(
        f"Room bookings to generate: "
        f"{ROOM_BOOKINGS_TO_CREATE}"
    )

    print(
        f"Ride bookings to generate: "
        f"{RIDE_BOOKINGS_TO_CREATE}"
    )

    with engine.begin() as connection:

        # ====================================================
        # GET SITES
        # ====================================================

        sites = get_sites(connection)

        if not sites:
            raise RuntimeError(
                "No active sites found."
            )

        print()
        print("Sites found:")

        for site in sites:
            print(
                f"  {site.site_id}: "
                f"{site.site_name}"
            )

        # ====================================================
        # GET ROOMS
        # ====================================================

        rooms = get_rooms(connection)

        if not rooms:
            raise RuntimeError(
                "No active rooms found."
            )

        print()
        print(
            f"Active rooms found: "
            f"{len(rooms)}"
        )

        # ====================================================
        # INITIALIZE COUNTERS
        # ====================================================

        room_counts = {
            site.site_name: {
                "PENDING": 0,
                "APPROVED": 0,
                "REJECTED": 0,
            }
            for site in sites
        }

        ride_counts = {
            site.site_name: {
                "PENDING": 0,
                "APPROVED": 0,
                "REJECTED": 0,
            }
            for site in sites
        }

        # ====================================================
        # ROOM BOOKINGS
        # ====================================================

        print()
        print("Seeding room bookings...")

        for _ in range(
            ROOM_BOOKINGS_TO_CREATE
        ):
            room = random.choice(rooms)

            status = insert_room_booking(
                connection,
                room,
            )

            room_counts[
                room.site_name
            ][status] += 1

        # ====================================================
        # RIDE BOOKINGS
        # ====================================================

        print(
            "Seeding ride bookings..."
        )

        for _ in range(
            RIDE_BOOKINGS_TO_CREATE
        ):
            site = random.choice(sites)

            status = insert_ride_booking(
                connection,
                site,
            )

            ride_counts[
                site.site_name
            ][status] += 1

        # ====================================================
        # TRANSACTION COMMITS AUTOMATICALLY
        # ====================================================

    # ========================================================
    # RESULTS
    # ========================================================

    print()
    print("=" * 60)
    print("SEEDING COMPLETE")
    print("=" * 60)

    print_counts(
        "ROOM BOOKINGS",
        room_counts,
    )

    print_counts(
        "RIDE BOOKINGS",
        ride_counts,
    )

    print()
    print("Date range:")
    print("  September 1, 2026")
    print("  September 30, 2026")

    print()
    print("Special rule:")
    print("  Zapote = ALL PENDING")

    print()
    print("Other sites:")
    print("  Binondo = Mixed")
    print("  Legazpi = Mixed")
    print("  Cebu = Mixed")

    print()
    print("=" * 60)


if __name__ == "__main__":
    main()