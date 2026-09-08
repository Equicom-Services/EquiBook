from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_admin,
    hash_password,
    password_change_required,
    verify_password,
)
from app.models.admin import Admin
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    TokenResponse
)
from app.services.auth_service import authenticate_admin


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    admin = authenticate_admin(
        db,
        data.email,
        data.password
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": "admin"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "must_change_password": password_change_required(admin)
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Set a new password for the signed-in admin.

    Used both for the forced first-login change and the 30-day
    rotation. The new password must differ from the current one;
    saving stamps ``password_changed_at`` (which also refreshes
    ``updated_at``), restarting the expiry clock.
    """
    new_password = data.new_password

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    if verify_password(
        new_password,
        current_admin.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "New password must be different from your "
                "current password."
            )
        )

    current_admin.password_hash = hash_password(new_password)
    current_admin.password_changed_at = datetime.now()

    db.commit()

    return {
        "message": "Password updated successfully."
    }
