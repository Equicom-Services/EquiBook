from app.core.database import SessionLocal
from app.models.admin import Admin
from app.core.security import hash_password


def seed_admin():
    db = SessionLocal()

    try:
        email = "admin@equiservices.com"
        password = "admin123"

        existing_admin = (
            db.query(Admin)
            .filter(Admin.email == email)
            .first()
        )

        if existing_admin:
            print(f"Admin already exists: {email}")
            return

        admin = Admin(
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin account created successfully.")
        print(f"Email: {email}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()