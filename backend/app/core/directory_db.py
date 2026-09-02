"""
Connection to the EXTERNAL employee directory database.

This is a second database living on another host — it is read-only for us and
has nothing to do with `app.core.database`, which owns Equibook's own tables.
Everything about it (host, credentials, table and column names) comes from
`.env`, because we do not control that schema.

The engine is created lazily so a missing or wrong `EMPLOYEE_DIRECTORY_URL`
degrades the autocomplete to "no suggestions" instead of stopping the API
from booting.
"""

import re

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings


# Table/column names are interpolated into SQL, so they may only ever be plain
# identifiers. They come from our own .env, never from a request, but a typo
# should fail loudly rather than turn into an injection point.
IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# LIKE escape character. Deliberately not a backslash: a backslash has to be
# doubled inside a SQL string literal, and whether that doubling is needed
# depends on the server's NO_BACKSLASH_ESCAPES mode. "!" needs no quoting
# anywhere.
LIKE_ESCAPE = "!"


_engine: Engine | None = None


def _check_identifier(value: str, label: str) -> str:
    if not IDENTIFIER_PATTERN.match(value):
        raise ValueError(
            f"Invalid {label} in employee directory settings: {value!r}"
        )

    return value


def _name_expression() -> str:
    """
    SQL expression for an employee's full name.

    EMPLOYEE_DIRECTORY_NAME_COLUMN takes one column ("fullname") or a
    comma-separated list ("firstname,lastname"), so the directory's own
    layout is a config change rather than a code change. Parts that are
    NULL or blank are skipped, and the rest joined by a single space.
    """

    columns = [
        _check_identifier(part.strip(), "name column")
        for part in settings.EMPLOYEE_DIRECTORY_NAME_COLUMN.split(",")
        if part.strip()
    ]

    if not columns:
        raise ValueError(
            "EMPLOYEE_DIRECTORY_NAME_COLUMN is empty."
        )

    if len(columns) == 1:
        return columns[0]

    joined = ", ".join(
        f"NULLIF(TRIM({column}), '')" for column in columns
    )

    return f"CONCAT_WS(' ', {joined})"


def get_directory_engine() -> Engine | None:
    """
    Return the shared engine for the directory database,
    or None when no directory is configured.
    """

    global _engine

    if not settings.EMPLOYEE_DIRECTORY_URL:
        return None

    if _engine is None:
        # connect_timeout is a MySQL driver argument; other drivers reject it
        connect_args = (
            {"connect_timeout": 5}
            if "mysql" in settings.EMPLOYEE_DIRECTORY_URL
            else {}
        )

        _engine = create_engine(
            settings.EMPLOYEE_DIRECTORY_URL,

            # The directory is a remote host we do not control, so recycle
            # idle connections and check them before handing them out.
            pool_pre_ping=True,
            pool_recycle=1800,
            pool_size=2,
            max_overflow=3,

            connect_args=connect_args,
        )

    return _engine


def check_directory() -> dict:
    """
    Read-only connectivity probe, so bad credentials can be spotted without
    reading the API logs. Runs `SELECT 1` and nothing else.
    """

    engine = get_directory_engine()

    if engine is None:
        return {
            "configured": False,
            "connected": False,
            "error": "EMPLOYEE_DIRECTORY_URL is not set.",
        }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "configured": True,
            "connected": True,
            "error": None,
        }
    except Exception as error:
        return {
            "configured": True,
            "connected": False,
            "error": str(error),
        }


def search_employees(query: str, limit: int) -> list[dict]:
    """
    Look up employees whose name or email contains `query`.

    Returns [] when the directory is not configured.
    """

    engine = get_directory_engine()

    if engine is None:
        return []

    table = _check_identifier(
        settings.EMPLOYEE_DIRECTORY_TABLE,
        "table name",
    )

    name_expression = _name_expression()

    email_column = _check_identifier(
        settings.EMPLOYEE_DIRECTORY_EMAIL_COLUMN,
        "email column",
    )

    # LIKE wildcards typed by the user are literal characters, not operators
    escaped = (
        query
        .replace(LIKE_ESCAPE, LIKE_ESCAPE * 2)
        .replace("%", f"{LIKE_ESCAPE}%")
        .replace("_", f"{LIKE_ESCAPE}_")
    )

    statement = text(
        f"""
        SELECT DISTINCT
            {name_expression} AS name,
            {email_column} AS email
        FROM {table}
        WHERE
            {email_column} IS NOT NULL
            AND {email_column} <> ''
            AND (
                {name_expression} LIKE :pattern ESCAPE '{LIKE_ESCAPE}'
                OR {email_column} LIKE :pattern ESCAPE '{LIKE_ESCAPE}'
            )
        ORDER BY name
        LIMIT :limit
        """
    )

    with engine.connect() as connection:
        rows = connection.execute(
            statement,
            {
                "pattern": f"%{escaped}%",
                "limit": limit,
            },
        ).mappings().all()

    return [
        {
            "name": (row["name"] or "").strip(),
            "email": (row["email"] or "").strip(),
        }
        for row in rows
        if row["name"] and row["email"]
    ]
