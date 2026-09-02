import time
from collections import deque

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.directory_db import check_directory, search_employees
from app.core.security import get_current_admin
from app.models.admin import Admin


router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


# ============================================================
# RATE LIMIT
#
# The search endpoint is public (employees book without
# logging in), so it is also the one place that exposes the
# staff directory. A short query returns at most a handful of
# rows, and this keeps anyone from walking the alphabet to
# collect the whole list.
#
# In-memory and per-process: enough for a single uvicorn
# deployment, not a substitute for a real gateway limit.
# ============================================================

MIN_QUERY_LENGTH = 2

RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW_SECONDS = 60

_request_log: dict[str, deque[float]] = {}


def _enforce_rate_limit(client_ip: str) -> None:
    now = time.monotonic()

    hits = _request_log.setdefault(client_ip, deque())

    while hits and now - hits[0] > RATE_LIMIT_WINDOW_SECONDS:
        hits.popleft()

    if len(hits) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many lookups. Please slow down.",
        )

    hits.append(now)

    # Drop callers that have gone quiet so the map cannot grow forever
    if len(_request_log) > 1000:
        for ip in [
            ip
            for ip, times in _request_log.items()
            if not times
            or now - times[-1] > RATE_LIMIT_WINDOW_SECONDS
        ]:
            _request_log.pop(ip, None)


# ============================================================
# SEARCH EMPLOYEE DIRECTORY
# PUBLIC (no auth)
#
# GET /api/employees/search?q=juan
#
# Backs the name/email autocomplete in the employee booking
# forms and the admin manual booking forms. Data comes from
# the external directory database, never from Equibook's own
# tables, and only ever by SELECT.
# ============================================================

@router.get("/search")
def search_employee_directory(
    request: Request,
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
):
    query = q.strip()

    if len(query) < MIN_QUERY_LENGTH:
        return []

    _enforce_rate_limit(
        request.client.host if request.client else "unknown"
    )

    try:
        return search_employees(query, limit)
    except Exception as error:
        # A directory that is down or misconfigured must not break the
        # booking form — the fields stay usable, just without suggestions.
        print(f"Employee directory lookup failed: {error}")

        return []


# ============================================================
# DIRECTORY HEALTH
# ADMIN ONLY
#
# GET /api/employees/directory-health
#
# Says whether the directory credentials in .env actually
# connect, so a misconfiguration doesn't just look like
# "autocomplete shows nothing".
# ============================================================

@router.get("/directory-health")
def directory_health(
    current_admin: Admin = Depends(get_current_admin),
):
    return check_directory()
