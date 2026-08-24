from app.core.database import SessionLocal
from app.models.admin import Admin
from app.core.security import hash_password

# to run = python -m scripts.seed_admin
def seed_admin():
    db = SessionLocal()

    try:
        name = "Gio D"
        email = "gio@equiservices.com"
        password = "admin123"
        site = "Binondo"

        existing_admin = db.query(Admin).filter(
            Admin.email == email
        ).first()

        if existing_admin:
            print("Admin already exists.")
            return

        admin = Admin(
            email=email,
            name=name,
            password_hash=hash_password(password),
            site=site,
            is_active=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin account created successfully.")
        print(f"Name: {name}")
        print(f"Email: {email}")
        print(f"Site: {site}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()