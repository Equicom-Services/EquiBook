from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.core.security import verify_password


def authenticate_admin(
    db: Session,
    email: str,
    password: str
):
    """
    Return the matching active admin, or None on any failure.

    The token and any password-expiry decision are left to the
    caller, which needs the admin row to build both.
    """

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

    return admin