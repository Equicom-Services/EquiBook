from fastapi import FastAPI, Depends

from app.core.database import Base, engine
from app.routers import auth
from app.dependencies.auth import get_current_admin
from app.models.admin import Admin


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="EquiServe API",
    version="1.0.0"
)


app.include_router(auth.router)


@app.get("/")
def root():
    return {
        "message": "EquiServe API is running"
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