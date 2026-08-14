from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.core.security import (
    verify_password,
    create_access_token
)


def authenticate_admin(
    db: Session,
    email: str,
    password: str
):

    admin = (
        db.query(Admin)
        .filter(Admin.email == email)
        .first()
    )

    if not admin:
        return None

    if not verify_password(
        password,
        admin.password_hash
    ):
        return None

    if not admin.is_active:
        return None

    token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": "admin"
    })

    return token