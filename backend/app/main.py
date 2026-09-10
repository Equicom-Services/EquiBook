import logging
import uuid

from fastapi import FastAPI, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.database import Base, engine, ensure_overall_access_column

from app.routers import auth
from app.routers import admin
from app.routers import reports
from app.routers import sites
from app.routers import rooms
from app.routers import room_requests
from app.routers import ride_reservations
from app.routers import dashboard
from app.routers import employees

from app.core.security import get_current_admin
from app.models.admin import Admin

load_dotenv()
Base.metadata.create_all(bind=engine)


def ensure_password_changed_at_column():
    """
    Add ``admin.password_changed_at`` to an already-created table.

    ``create_all`` only creates missing tables, never alters existing
    ones, and this project has no Alembic migrations. Existing rows
    are left NULL on purpose so every current admin is prompted to
    set a fresh password on their next login.
    """
    inspector = inspect(engine)

    existing_columns = [
        column["name"]
        for column in inspector.get_columns("admin")
    ]

    if "password_changed_at" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE admin "
                    "ADD COLUMN password_changed_at DATETIME NULL"
                )
            )


ensure_password_changed_at_column()
ensure_overall_access_column()


def ensure_performance_indexes():
    """
    Add indexes on the columns the booking queries filter and sort
    by, so the list/calendar endpoints stay fast as the tables grow.

    Only primary and foreign keys are indexed by default, but the
    hot endpoints filter on status / reservation_date / travel_date
    / site. MySQL has no "CREATE INDEX IF NOT EXISTS", so each index
    is created only when absent. All are plain secondary indexes, so
    creating them is safe and non-destructive.
    """
    wanted = {
        "room_reservation_request": {
            "ix_rrr_status": ["status"],
            "ix_rrr_reservation_date": ["reservation_date"],
        },
        "ride_reservation_request": {
            "ix_ride_status": ["status"],
            "ix_ride_travel_date": ["travel_date"],
            "ix_ride_site": ["site"],
        },
    }

    inspector = inspect(engine)

    with engine.begin() as connection:
        for table, indexes in wanted.items():
            existing = {
                index["name"]
                for index in inspector.get_indexes(table)
            }

            for name, columns in indexes.items():
                if name in existing:
                    continue

                column_list = ", ".join(columns)

                connection.execute(
                    text(
                        f"CREATE INDEX {name} "
                        f"ON {table} ({column_list})"
                    )
                )


ensure_performance_indexes()


app = FastAPI(
    title="Equibook API",
    version="1.0.0"
)

logger = logging.getLogger("equibook")


# ==============================================================
# ERROR HANDLING
#
# Routers raise HTTPException with messages written for the
# person using the app, and those are passed through untouched.
# Anything else is a bug or a malformed request, so the detail
# is logged here and the caller gets a plain sentence instead.
# ==============================================================

@app.middleware("http")
async def handle_unexpected_errors(
    request: Request,
    call_next,
):
    """
    Catch anything a router did not handle.

    Registered before the CORS middleware on purpose. Starlette
    inserts each new middleware at the front of the stack, so
    adding CORS afterwards leaves it on the outside and the
    error response below still gets its CORS headers. Without
    that the browser reports a CORS failure and the message
    never reaches the UI.
    """
    try:
        return await call_next(request)

    except Exception:
        reference = uuid.uuid4().hex[:8]

        logger.exception(
            "Unhandled error [%s] %s %s",
            reference,
            request.method,
            request.url.path,
        )

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "Something went wrong on our end. "
                    "Please try again, and quote reference "
                    f"{reference} if it keeps happening."
                )
            },
        )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(
    request: Request,
    exc: RequestValidationError,
):
    """
    Replace the pydantic error list with one sentence.

    The raw list names fields and types the employee never sees,
    so it is logged rather than displayed.
    """
    logger.warning(
        "Validation error %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )

    return JSONResponse(
        status_code=422,
        content={
            "detail": (
                "Some of the information sent was invalid. "
                "Please check the form and try again."
            )
        },
    )


#cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Routers
app.include_router(
    auth.router,
    prefix="/api"
)
app.include_router(
    rooms.router,
    prefix="/api"
)
app.include_router(
    sites.router,
    prefix="/api",
)

app.include_router(
    reports.router,
    prefix="/api",
)
app.include_router(
    admin.router,
    prefix="/api"
)
app.include_router(
    room_requests.router,
    prefix="/api"
)

app.include_router(
    dashboard.router,
    prefix="/api"
)

app.include_router(
    ride_reservations.router,
    prefix="/api",
)

app.include_router(
    employees.router,
    prefix="/api",
)

@app.get("/")
def root():
    return {
        "message": "Equibook API is running"
    }


@app.get("/admin/me")
def admin_me(
    admin: Admin = Depends(get_current_admin)
):

    return {
        "id": admin.id,
        "email": admin.email,
        "is_active": admin.is_active
    }