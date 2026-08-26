from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.config import settings
from app.routers import room_requests
from app.core.database import Base, engine
from app.routers import sites
from app.routers import room
from app.routers import ride_reservations
from app.routers import dashboard
from app.routers import auth
from app.routers import admin

from app.core.security import get_current_admin
from app.models.admin import Admin


load_dotenv()
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Equibook API",
    version="1.0.0"
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
    room.router,
    prefix="/api"
)
app.include_router(
    sites.router,
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