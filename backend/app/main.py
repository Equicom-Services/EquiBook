import logging
import uuid

from fastapi import FastAPI, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import Base, engine

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