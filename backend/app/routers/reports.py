from datetime import date
from io import BytesIO
import csv

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.room_request import RoomRequest
from app.models.ride_reservation import RideReservation
from app.models.room import Room
from app.models.site import Site

from weasyprint import HTML


router = APIRouter(
    prefix="/admin/reports",
    tags=["Reports"],
)


@router.get("")
def generate_report(
    type: str = Query(..., pattern="^(room|ride)$"),
    start_date: date = Query(...),
    end_date: date = Query(...),
    status: str = Query("all"),
    format: str = Query("pdf", pattern="^(pdf|csv)$"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    if start_date > end_date:
        return Response(
            content="Start date cannot be later than end date.",
            status_code=400,
        )

    # ==========================================================
    # ROOM REPORT
    # ==========================================================

    if type == "room":
        query = (
            db.query(RoomRequest, Room.room_name)
            .join(
                Room,
                Room.room_id == RoomRequest.room_id,
            )
            .join(
                Site,
                Site.site_id == Room.site_id,
            )
            .filter(
                # A report covers the admin's own site only.
                Site.site_name == current_admin.site,
                RoomRequest.reservation_date >= start_date,
                RoomRequest.reservation_date <= end_date,
            )
        )

        if status != "all":
            query = query.filter(
                RoomRequest.status.ilike(status)
            )

        results = query.order_by(
            RoomRequest.reservation_date.asc(),
            RoomRequest.start_time.asc(),
        ).all()

        rows = []

        for request, room_name in results:
            rows.append(
                {
                    "ID": request.room_reservation_id,
                    "Employee": request.employee_name,
                    "Email": request.employee_email,
                    "Room": room_name,
                    "Reservation Date": request.reservation_date,
                    "Start Time": request.start_time,
                    "End Time": request.end_time,
                    "Duration (Minutes)": request.duration_minutes,
                    "Purpose": request.purpose,
                    "Status": request.status,
                    "Admin Remarks": request.admin_remarks or "",
                    "Requested At": request.request_date_time,
                }
            )

        report_title = "Room Reservation Report"

    # ==========================================================
    # RIDE REPORT
    # ==========================================================

    else:
        query = (
            db.query(RideReservation)
            .filter(
                # A report covers the admin's own site only.
                RideReservation.site == current_admin.site,
                RideReservation.travel_date >= start_date,
                RideReservation.travel_date <= end_date,
            )
        )

        if status != "all":
            query = query.filter(
                RideReservation.status.ilike(status)
            )

        results = query.order_by(
            RideReservation.travel_date.asc(),
            RideReservation.departure_time.asc(),
        ).all()

        rows = []

        for request in results:
            rows.append(
                {
                    "ID": request.ride_reservation_id,
                    "Employee": request.employee_name,
                    "Email": request.employee_email,
                    "Site": request.site,
                    "Travel Date": request.travel_date,
                    "Departure Time": request.departure_time,
                    "Pickup Location": request.pickup_location,
                    "Dropoff Destination": request.dropoff_destination,
                    "Round Trip": "Yes" if request.roundtrip else "No",
                    "Return Pickup": request.return_pickup or "",
                    "Return Dropoff": (
                        request.return_drop_off_location or ""
                    ),
                    "Passengers": request.passenger_count,
                    "Vehicle Type": request.vehicle_type or "",
                    "Purpose": request.purpose,
                    "Status": request.status,
                    "Admin Remarks": request.admin_remarks or "",
                    "Requested At": request.request_date_time,
                }
            )

        report_title = "Ride Reservation Report"

    # ==========================================================
    # CSV
    # ==========================================================

    if format == "csv":
        output = BytesIO()

        text_output = output

        # UTF-8 BOM helps Excel correctly detect UTF-8.
        csv_content = "\ufeff"

        if rows:
            fieldnames = list(rows[0].keys())

            csv_content += ",".join(
                f'"{field}"' for field in fieldnames
            )
            csv_content += "\n"

            for row in rows:
                values = []

                for field in fieldnames:
                    value = row[field]

                    if value is None:
                        value = ""

                    value = str(value).replace('"', '""')

                    values.append(f'"{value}"')

                csv_content += ",".join(values)
                csv_content += "\n"

        else:
            csv_content = (
                "\ufeff"
                "No reservations found for the selected criteria.\n"
            )

        filename = (
            f"{type}-booking-report-"
            f"{start_date}-to-{end_date}.csv"
        )

        return Response(
            content=csv_content.encode("utf-8"),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    # ==========================================================
    # PDF
    # ==========================================================

    html = build_report_html(
        report_title=report_title,
        reservation_type=type,
        start_date=start_date,
        end_date=end_date,
        status=status,
        rows=rows,
    )

    pdf = HTML(
        string=html
    ).write_pdf()

    filename = (
        f"{type}-booking-report-"
        f"{start_date}-to-{end_date}.pdf"
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# ==============================================================
# HTML REPORT
# ==============================================================

def build_report_html(
    report_title: str,
    reservation_type: str,
    start_date: date,
    end_date: date,
    status: str,
    rows: list[dict],
) -> str:

    if status == "all":
        status_display = "All Statuses"
    else:
        status_display = status.capitalize()

    # ----------------------------------------------------------
    # SUMMARY
    #
    # A report filtered to one status only ever contains that
    # status, so it gets a single card. Showing the full set of
    # counters there would leave every other card reading zero.
    # ----------------------------------------------------------

    total = len(rows)

    def count_status(name: str) -> int:
        return sum(
            1
            for row in rows
            if str(row.get("Status", "")).upper()
            == name
        )

    if status == "all":
        summary_cards = [
            ("Total Bookings", total),
            ("Approved", count_status("APPROVED")),
            ("Pending", count_status("PENDING")),
            ("Rejected", count_status("REJECTED")),
            ("Cancelled", count_status("CANCELLED")),
        ]
    else:
        summary_cards = [
            (f"{status_display} Bookings", total),
        ]

    summary_class = (
        "summary"
        if status == "all"
        else "summary summary-single"
    )

    summary_html = "".join(
        f"""
            <div class="summary-card">
                <div class="summary-label">
                    {escape_html(label)}
                </div>

                <div class="summary-value">
                    {value}
                </div>
            </div>
        """
        for label, value in summary_cards
    )

    # ----------------------------------------------------------
    # TABLE
    # ----------------------------------------------------------

    if rows:
        headers = list(rows[0].keys())

        header_html = "".join(
            f"<th>{escape_html(header)}</th>"
            for header in headers
        )

        body_html = ""

        for row in rows:
            body_html += "<tr>"

            for header in headers:
                value = row.get(header, "")

                if value is None:
                    value = ""

                value = escape_html(str(value))

                body_html += f"<td>{value}</td>"

            body_html += "</tr>"

        table_html = f"""
        <table>
            <thead>
                <tr>
                    {header_html}
                </tr>
            </thead>

            <tbody>
                {body_html}
            </tbody>
        </table>
        """

    else:
        table_html = """
        <div class="empty">
            No reservations found for the selected criteria.
        </div>
        """

    # ----------------------------------------------------------
    # HTML
    # ----------------------------------------------------------

    return f"""
    <!DOCTYPE html>

    <html>
    <head>

        <meta charset="UTF-8">

        <style>

            @page {{
                size: A4 landscape;
                margin: 18mm 12mm;
            }}

            * {{
                box-sizing: border-box;
            }}

            body {{
                font-family: Arial, Helvetica, sans-serif;
                color: #1e293b;
                margin: 0;
                font-size: 9px;
            }}

            .header {{
                margin-bottom: 20px;
                border-bottom: 2px solid #03045e;
                padding-bottom: 12px;
            }}

            .header h1 {{
                margin: 0;
                color: #03045e;
                font-size: 22px;
            }}

            .header p {{
                margin: 5px 0 0;
                color: #64748b;
                font-size: 10px;
            }}

            .meta {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }}

            .meta-item {{
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 5px;
                padding: 8px 12px;
                min-width: 130px;
            }}

            .meta-label {{
                color: #64748b;
                font-size: 8px;
                text-transform: uppercase;
                margin-bottom: 3px;
            }}

            .meta-value {{
                font-weight: bold;
                color: #0f172a;
                font-size: 10px;
            }}

            .summary {{
                display: flex;
                gap: 10px;
                margin-bottom: 18px;
            }}

            .summary-card {{
                flex: 1;
                border: 1px solid #e2e8f0;
                border-radius: 5px;
                padding: 9px;
                background: #ffffff;
            }}

            .summary-single .summary-card {{
                flex: 0 0 150px;
            }}

            .summary-label {{
                color: #64748b;
                font-size: 8px;
            }}

            .summary-value {{
                margin-top: 3px;
                font-size: 16px;
                font-weight: bold;
                color: #03045e;
            }}

            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
            }}

            th {{
                background: #03045e;
                color: white;
                padding: 6px;
                text-align: left;
                font-size: 8px;
                border: 1px solid #03045e;
            }}

            td {{
                padding: 5px;
                border: 1px solid #cbd5e1;
                vertical-align: top;
                font-size: 8px;
            }}

            tr:nth-child(even) {{
                background: #f8fafc;
            }}

            .empty {{
                border: 1px solid #e2e8f0;
                padding: 25px;
                text-align: center;
                color: #64748b;
            }}

            .footer {{
                margin-top: 20px;
                padding-top: 8px;
                border-top: 1px solid #e2e8f0;
                color: #94a3b8;
                font-size: 8px;
            }}

        </style>

    </head>

    <body>

        <div class="header">

            <h1>
                {escape_html(report_title)}
            </h1>

            <p>
                EquiBook Reservation Management System
            </p>

        </div>

        <div class="meta">

            <div class="meta-item">
                <div class="meta-label">
                    Reservation Type
                </div>

                <div class="meta-value">
                    {reservation_type.capitalize()}
                </div>
            </div>

            <div class="meta-item">
                <div class="meta-label">
                    Date Range
                </div>

                <div class="meta-value">
                    {start_date} - {end_date}
                </div>
            </div>

            <div class="meta-item">
                <div class="meta-label">
                    Status
                </div>

                <div class="meta-value">
                    {escape_html(status_display)}
                </div>
            </div>

        </div>

        <div class="{summary_class}">

            {summary_html}

        </div>

        {table_html}

        <div class="footer">
            Generated by EquiBook Admin Dashboard
        </div>

    </body>

    </html>
    """


def escape_html(value: str) -> str:
    return (
        value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#x27;")
    )