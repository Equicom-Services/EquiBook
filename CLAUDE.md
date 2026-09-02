# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Equibook is a room- and ride-reservation system for Equicom's office sites. Employees submit
booking requests without logging in; site admins log in to approve/reject/manage them. It's a
two-part monorepo:

- `backend/` — FastAPI + SQLAlchemy + MySQL (Python 3.12)
- `frontend/` — Next.js 16 (App Router) + React 19 + Tailwind CSS v4 (TypeScript)

## Commands

### Backend (run from `backend/`)
```bash
source .venv/bin/activate          # deps live in .venv (see requirements.txt)
python run.py                      # start API with uvicorn --reload (host/port from .env)
python -m scripts.seed_admin       # create the initial admin account
python seed_bookings.py            # seed sample bookings for local dev
python -m scripts.test_email       # smoke-test SMTP config
```
`run.py` reads `BACKEND_HOST`/`BACKEND_PORT` from `backend/.env` (currently `10.11.1.135:8080`).
There is no test suite and no linter configured for the backend.

### Frontend (run from `frontend/`)
```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (eslint-config-next)
```
`NEXT_PUBLIC_API_URL` in `frontend/.env.local` must point at the backend origin **without** a
trailing `/api` (endpoint strings include `/api/...` themselves).

## Architecture

### Backend layering (`backend/app/`)
Requests flow `routers/ → services/ → models/`, with `schemas/` (Pydantic) for I/O validation and
`core/` for cross-cutting concerns:
- `main.py` — creates the app, configures CORS (single allowed origin = `settings.FRONTEND_URL`),
  registers every router under the `/api` prefix, and calls `Base.metadata.create_all()` on
  startup. **There are no Alembic migrations** despite `alembic` being in requirements — tables are
  created from the models at boot, so schema changes mean editing the model + recreating tables.
- `core/config.py` — all config comes from `.env` via pydantic-settings; missing vars fail at import.
- `core/database.py` — engine/session; `get_db()` is the FastAPI dependency for a request-scoped session.
- `core/security.py` — bcrypt hashing, JWT (HS256) create/decode, and the **`get_current_admin`
  dependency that routers actually use**. Note: `dependencies/auth.py` contains a *second*,
  unused `get_current_admin` (HTTPBearer + role check); don't confuse the two.

### The central authorization model: site scoping
Every admin row has a `site` string (e.g. `"Zapote"`). This is the app's multi-tenancy boundary:
**admin endpoints filter results by `Site.site_name == current_admin.site`** and reject cross-site
mutations with 403. When adding or reviewing admin endpoints, preserve this filter — it is the only
thing isolating one office's data from another. Login issues a JWT carrying `sub` (admin id),
`email`, and `role: "admin"`.

Endpoints split into two access tiers:
- **Public (no auth):** employees create requests and read "active" calendar data
  (e.g. `POST /api/room-requests`, `GET /api/room-requests/active`).
- **Admin (Bearer token):** everything scoped to the admin's site — approvals, admin-created
  bookings, reports, dashboard.

### Booking lifecycle & overlap rules (see `routers/room_requests.py`)
Status flows `PENDING → APPROVED | REJECTED | CANCELLED`. Key domain logic to respect when editing:
- Approving a request **auto-rejects overlapping PENDING requests** for the same room/date/time and
  emails those employees.
- Admin-created bookings are inserted directly as `APPROVED`.
- Overlap detection is `existing.start_time < new.end_time AND existing.end_time > new.start_time`,
  checked only against `APPROVED` rows.
- Finalized (`APPROVED`/`REJECTED`) requests can't be re-transitioned.
- `approved_rejected_by` stores the admin id; `employee_name`/`employee_email` are always the
  *requester*, never the acting admin.

Rides mirror this pattern under `/api/ride-reservations` with `models/ride_reservation.py`.

### External employee directory (autocomplete)
`core/directory_db.py` holds a **second, read-only** SQLAlchemy engine pointing at another host's
employee database (`EMPLOYEE_DIRECTORY_*` in `.env`). It backs the name/email autocomplete in the
booking forms via public `GET /api/employees/search`, and only ever issues `SELECT` — never write
to it, and never mix it with `core/database.py`, which owns Equibook's own tables. Table and column
names are config, not code, because we don't control that schema (`NAME_COLUMN` accepts
`firstname,lastname`). The engine is lazy and every failure degrades to "no suggestions", so a dead
directory can't stop the API booting or block a booking. `GET /api/employees/directory-health`
(admin) reports whether the credentials connect.

### Email
Notifications (submitted/approved/rejected/cancelled) are sent through `services/email_service.py`
using templates in `services/email_templates.py`, always dispatched via FastAPI `BackgroundTasks`
so the HTTP response isn't blocked. SMTP config is in `.env` (`SMTP_HOST/PORT/FROM_EMAIL`).

### Response shape convention
Routers build response dicts **by hand** (field-by-field), joining Room/Site/Admin to enrich rows,
rather than relying on Pydantic ORM mode. It's verbose but intentional — match the existing
pattern when adding fields, and update the matching schema in `schemas/`.

### Frontend structure (`frontend/`)
App Router pages in `app/` are thin; real UI lives in `components/`, split by audience:
`components/admin/`, `components/employee/room/`, `components/employee/ride/`, `components/shared/`.
`app/page.tsx` redirects to `/employee_page`; admins use `/admin/login` → `/admin/dashboard`.
- `lib/api.ts` — `apiFetch(endpoint, options)` is the standard authenticated call: it reads the JWT
  from `localStorage.getItem("access_token")` and sets the `Authorization: Bearer` header. Prefer
  it over raw `fetch` for admin calls.
- `services/auth.ts` — `loginAdmin()` posts to `/api/auth/login`; the caller stores the returned
  token in `localStorage` under `access_token`.
- Calendars use FullCalendar (`@fullcalendar/*`); `@/*` path alias maps to the frontend root.

## Important: Next.js version
`frontend/AGENTS.md` (imported by `frontend/CLAUDE.md`) warns that this is Next.js 16 with breaking
changes vs. older versions — consult `frontend/node_modules/next/dist/docs/` before writing Next.js
code rather than relying on prior knowledge. That AGENTS.md block is regenerated by `next dev`;
commit it with your changes to keep the tree clean.
