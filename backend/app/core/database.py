import pymysql
pymysql.install_as_MySQLdb()
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

def ensure_overall_access_column():
    """
    Add ``admin.overall_access`` to an already-created table.

    ``create_all`` only creates missing tables, never alters existing
    ones, and this project has no Alembic migrations. Lives here
    rather than in ``main.py`` because the control panel
    (``scripts/seed_admin.py``) runs without booting the API and needs
    the same column. Existing rows default to 0, so nobody gains panel
    access just by upgrading.
    """
    inspector = inspect(engine)

    existing_columns = [
        column["name"]
        for column in inspector.get_columns("admin")
    ]

    if "overall_access" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE admin "
                    "ADD COLUMN overall_access TINYINT NOT NULL DEFAULT 0"
                )
            )


def ensure_audit_log_table():
    """
    Create the ``audit_logs`` table if it is not there yet.

    The control panel (``scripts/seed_admin.py``) is the only thing
    that writes to it, and it runs without booting the API, so it
    cannot rely on ``main.py``'s ``create_all``. ``checkfirst`` makes
    this a no-op on every run after the first.
    """
    from app.models.audit_log import AuditLog

    AuditLog.__table__.create(bind=engine, checkfirst=True)
