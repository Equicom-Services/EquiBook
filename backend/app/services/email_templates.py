def booking_submitted_email(
    employee_name: str,
    employee_email: str,
    room: str,
    site: str,
    reservation_date,
    start_time,
    end_time,
    purpose: str,
):
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Room Booking Request</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td align="center" style="padding:32px 20px;">

            <!-- MAIN CONTAINER -->
            <table
                width="720"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    width:100%;
                    max-width:720px;
                    background:#ffffff;
                "
            >

                <!-- HEADER -->
                <tr>
                    <td style="
                        background:#03045e;
                        padding:24px 32px;
                        color:#ffffff;
                    ">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <div style="
                                        font-size:12px;
                                        text-transform:uppercase;
                                        letter-spacing:1px;
                                        color:#bfdbfe;
                                        margin-bottom:7px;
                                    ">
                                        ROOM RESERVATION
                                    </div>

                                    <div style="
                                        font-size:22px;
                                        font-weight:600;
                                        line-height:1.3;
                                    ">
                                        New Booking Request
                                    </div>
                                </td>

                                <td
                                    align="right"
                                    valign="middle"
                                    style="
                                        font-size:13px;
                                        color:#dbeafe;
                                    "
                                >
                                    Action Required
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                    <td style="padding:32px;">

                        <p style="
                            margin:0 0 8px;
                            font-size:16px;
                            color:#111827;
                        ">
                            Hello Admin,
                        </p>

                        <p style="
                            margin:0 0 28px;
                            font-size:14px;
                            line-height:1.6;
                            color:#4b5563;
                        ">
                            A new room reservation request has been submitted
                            and is waiting for your review.
                        </p>

                        <!-- SECTION TITLE -->
                        <div style="
                            font-size:13px;
                            font-weight:bold;
                            text-transform:uppercase;
                            letter-spacing:.5px;
                            color:#03045e;
                            padding-bottom:10px;
                            border-bottom:2px solid #03045e;
                        ">
                            Booking Details
                        </div>

                        <!-- DETAILS -->
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="font-size:14px;"
                        >

                            <tr>
                                <td width="25%" style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Employee
                                </td>
                                <td width="25%" style="
                                    padding:13px 20px 13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {employee_name}
                                </td>

                                <td width="20%" style="
                                    padding:13px 12px;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Email
                                </td>
                                <td width="30%" style="
                                    padding:13px 0;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {employee_email}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Site
                                </td>
                                <td style="
                                    padding:13px 20px 13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {site}
                                </td>

                                <td style="
                                    padding:13px 12px;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Room
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {room}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Date
                                </td>
                                <td style="
                                    padding:13px 20px 13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {reservation_date}
                                </td>

                                <td style="
                                    padding:13px 12px;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Time
                                </td>
                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {start_time} - {end_time}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    vertical-align:top;
                                ">
                                    Purpose
                                </td>

                                <td
                                    colspan="3"
                                    style="
                                        padding:13px 0;
                                        line-height:1.5;
                                    "
                                >
                                    {purpose}
                                </td>
                            </tr>

                        </table>

                        <!-- ACTION -->
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="margin-top:28px;"
                        >
                            <tr>
                                <td style="
                                    border-left:4px solid #f59e0b;
                                    padding:14px 18px;
                                    background:#fffbeb;
                                ">
                                    <div style="
                                        font-weight:bold;
                                        font-size:14px;
                                        color:#92400e;
                                    ">
                                        Review Required
                                    </div>

                                    <div style="
                                        margin-top:5px;
                                        font-size:13px;
                                        line-height:1.5;
                                        color:#78350f;
                                    ">
                                        Please log in to the admin dashboard
                                        to approve or reject this request.
                                    </div>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="
                        padding:18px 32px;
                        background:#f8fafc;
                        border-top:1px solid #e5e7eb;
                        text-align:left;
                    ">
                        <span style="
                            font-size:11px;
                            color:#6b7280;
                        ">
                            Automated notification from the Room Reservation System.
                            Please do not reply to this email.
                        </span>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
"""


def booking_status_email(
    employee_name: str,
    status: str,
    room: str,
    site: str,
    reservation_date,
    start_time,
    end_time,
    purpose: str,
    remarks: str | None = None,
):
    status = status.lower()

    if status == "approved":
        status_title = "Booking Approved"
        status_message = "Your room booking request has been approved."
        status_color = "#166534"
        status_background = "#f0fdf4"
        status_border = "#22c55e"

    elif status == "rejected":
        status_title = "Booking Rejected"
        status_message = (
            "Your room booking request has been reviewed "
            "and was not approved."
        )
        status_color = "#991b1b"
        status_background = "#fef2f2"
        status_border = "#ef4444"

    elif status == "cancelled":
        status_title = "Booking Cancelled"
        status_message = "Your room booking has been cancelled."
        status_color = "#92400e"
        status_background = "#fffbeb"
        status_border = "#f59e0b"

    elif status == "pending":
        status_title = "Booking Request Received"
        status_message = (
            "We have received your room booking request. "
            "It is currently PENDING and will be reviewed by "
            "the site admin."
        )
        status_color = "#1e3a8a"
        status_background = "#eff6ff"
        status_border = "#3b82f6"

    else:
        status_title = f"Booking {status.capitalize()}"
        status_message = f"Your room booking request status is {status}."
        status_color = "#1e3a8a"
        status_background = "#eff6ff"
        status_border = "#3b82f6"

    remarks_html = ""

    if remarks:
        remarks_html = f"""
        <tr>
            <td style="
                padding:18px 0 0;
                border-top:1px solid #e5e7eb;
            ">

                <div style="
                    font-size:13px;
                    font-weight:bold;
                    color:#03045e;
                    margin-bottom:8px;
                ">
                    ADMIN REMARKS
                </div>

                <div style="
                    padding:14px 16px;
                    background:#f8fafc;
                    border-left:3px solid #94a3b8;
                    font-size:14px;
                    line-height:1.6;
                    color:#475569;
                ">
                    {remarks}
                </div>

            </td>
        </tr>
        """

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{status_title}</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td align="center" style="padding:32px 20px;">

            <table
                width="720"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    width:100%;
                    max-width:720px;
                    background:#ffffff;
                "
            >

                <!-- HEADER -->
                <tr>
                    <td style="
                        background:#03045e;
                        padding:24px 32px;
                        color:#ffffff;
                    ">
                        <div style="
                            font-size:12px;
                            text-transform:uppercase;
                            letter-spacing:1px;
                            color:#bfdbfe;
                            margin-bottom:7px;
                        ">
                            ROOM RESERVATION
                        </div>

                        <div style="
                            font-size:22px;
                            font-weight:600;
                        ">
                            {status_title}
                        </div>
                    </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                    <td style="padding:32px;">

                        <p style="
                            margin:0 0 8px;
                            font-size:16px;
                            color:#111827;
                        ">
                            Hello <strong>{employee_name}</strong>,
                        </p>

                        <!-- STATUS -->
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="margin:22px 0 28px;"
                        >
                            <tr>
                                <td style="
                                    padding:15px 18px;
                                    background:{status_background};
                                    border-left:4px solid {status_border};
                                ">
                                    <div style="
                                        font-size:15px;
                                        font-weight:bold;
                                        color:{status_color};
                                    ">
                                        {status_message}
                                    </div>

                                    <div style="
                                        margin-top:5px;
                                        font-size:13px;
                                        color:{status_color};
                                    ">
                                        Status: <strong>{status.upper()}</strong>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- SECTION -->
                        <div style="
                            font-size:13px;
                            font-weight:bold;
                            text-transform:uppercase;
                            letter-spacing:.5px;
                            color:#03045e;
                            padding-bottom:10px;
                            border-bottom:2px solid #03045e;
                        ">
                            Reservation Details
                        </div>

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="font-size:14px;"
                        >

                            <tr>
                                <td width="25%" style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Site
                                </td>

                                <td width="25%" style="
                                    padding:13px 20px 13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {site}
                                </td>

                                <td width="20%" style="
                                    padding:13px 12px;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Room
                                </td>

                                <td width="30%" style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {room}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Date
                                </td>

                                <td style="
                                    padding:13px 20px 13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {reservation_date}
                                </td>

                                <td style="
                                    padding:13px 12px;
                                    color:#64748b;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    Time
                                </td>

                                <td style="
                                    padding:13px 0;
                                    font-weight:600;
                                    border-bottom:1px solid #e5e7eb;
                                ">
                                    {start_time} - {end_time}
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                    padding:13px 12px 13px 0;
                                    color:#64748b;
                                    vertical-align:top;
                                ">
                                    Purpose
                                </td>

                                <td
                                    colspan="3"
                                    style="
                                        padding:13px 0;
                                        line-height:1.5;
                                    "
                                >
                                    {purpose}
                                </td>
                            </tr>

                            {remarks_html}

                        </table>

                        <p style="
                            margin:28px 0 0;
                            font-size:13px;
                            line-height:1.6;
                            color:#64748b;
                        ">
                            Thank you for using the Room Reservation System.
                        </p>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td style="
                        padding:18px 32px;
                        background:#f8fafc;
                        border-top:1px solid #e5e7eb;
                    ">
                        <span style="
                            font-size:11px;
                            color:#6b7280;
                        ">
                            Automated notification. Please do not reply to this email.
                        </span>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
"""


def ride_booking_submitted_email(
    employee_name: str,
    employee_email: str,
    site: str,
    travel_date,
    departure_time,
    roundtrip: bool,
    return_pickup: str | None,
    pickup_location: str,
    pickup_maps_link: str | None,
    dropoff_destination: str,
    drop_off_maps_link: str | None,
    return_drop_off_location: str | None,
    return_drop_off_maps_link: str | None,
    purpose: str,
    passenger_count: int,
):
    roundtrip_text = "Yes" if roundtrip else "No"

    pickup_map_html = (
        f"""
        <a href="{pickup_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f"""
        <a href="{drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if drop_off_maps_link
        else "Not provided"
    )

    return_map_html = (
        f"""
        <a href="{return_drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if return_drop_off_maps_link
        else "Not provided"
    )

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ride Reservation Submitted</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:32px 20px;">

<table
    width="720"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:720px;
        background:#ffffff;
    "
>

    <!-- HEADER -->
    <tr>
        <td style="
            background:#03045e;
            padding:24px 32px;
            color:#ffffff;
        ">
            <div style="
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:1px;
                color:#bfdbfe;
                margin-bottom:7px;
            ">
                RIDE RESERVATION
            </div>

            <div style="
                font-size:22px;
                font-weight:600;
            ">
                Reservation Submitted
            </div>
        </td>
    </tr>

    <!-- CONTENT -->
    <tr>
        <td style="padding:32px;">

            <p style="
                margin:0 0 8px;
                font-size:16px;
            ">
                Hello <strong>{employee_name}</strong>,
            </p>

            <p style="
                margin:0 0 24px;
                font-size:14px;
                line-height:1.6;
                color:#4b5563;
            ">
                Your transportation request has been successfully submitted.
            </p>

            <!-- STATUS -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="
                        padding:14px 18px;
                        background:#fffbeb;
                        border-left:4px solid #f59e0b;
                    ">
                        <strong style="
                            font-size:14px;
                            color:#92400e;
                        ">
                            Status: Pending Approval
                        </strong>

                        <div style="
                            margin-top:5px;
                            font-size:13px;
                            color:#78350f;
                        ">
                            Your request is currently waiting for approval.
                        </div>
                    </td>
                </tr>
            </table>

            <!-- RESERVATION -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Reservation Details
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Employee
                    </td>

                    <td width="25%" style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_name}
                    </td>

                    <td width="20%" style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Email
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_email}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Site
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {site}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Travel Date
                    </td>

                    <td style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {travel_date}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Departure
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {departure_time}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Round Trip
                    </td>

                    <td style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {roundtrip_text}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Passengers
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {passenger_count}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Purpose
                    </td>

                    <td style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {purpose}
                    </td>
                </tr>

            </table>

            <!-- TRIP -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Trip Information
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Pickup
                    </td>

                    <td width="45%" style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_location}
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_destination}
                    </td>

                    <td style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Return Pickup
                    </td>

                    <td colspan="2" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {return_pickup or "N/A"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                    ">
                        Return Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                    ">
                        {return_drop_off_location or "N/A"}
                    </td>

                    <td style="
                        padding:13px 0;
                    ">
                        {return_map_html}
                    </td>
                </tr>

            </table>

            <p style="
                margin:28px 0 0;
                font-size:13px;
                line-height:1.6;
                color:#64748b;
            ">
                You will receive another email once your request has been reviewed.
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style="
            padding:18px 32px;
            background:#f8fafc;
            border-top:1px solid #e5e7eb;
        ">
            <span style="
                font-size:11px;
                color:#6b7280;
            ">
                Automated notification from the Ride Reservation System.
                Please do not reply to this email.
            </span>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
"""


def ride_booking_admin_email(
    employee_name: str,
    employee_email: str,
    site: str,
    travel_date,
    departure_time,
    roundtrip: bool,
    return_pickup: str | None,
    pickup_location: str,
    pickup_maps_link: str | None,
    dropoff_destination: str,
    drop_off_maps_link: str | None,
    return_drop_off_location: str | None,
    return_drop_off_maps_link: str | None,
    purpose: str,
    passenger_count: int,
):
    roundtrip_text = "Yes" if roundtrip else "No"

    pickup_map_html = (
        f"""
        <a href="{pickup_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f"""
        <a href="{drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if drop_off_maps_link
        else "Not provided"
    )

    return_map_html = (
        f"""
        <a href="{return_drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if return_drop_off_maps_link
        else "Not provided"
    )

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Ride Reservation Request</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:32px 20px;">

<table
    width="720"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:720px;
        background:#ffffff;
    "
>

    <!-- HEADER -->
    <tr>
        <td style="
            background:#03045e;
            padding:24px 32px;
            color:#ffffff;
        ">
            <div style="
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:1px;
                color:#bfdbfe;
                margin-bottom:7px;
            ">
                RIDE RESERVATION
            </div>

            <div style="
                font-size:22px;
                font-weight:600;
            ">
                New Reservation Request
            </div>
        </td>
    </tr>

    <!-- CONTENT -->
    <tr>
        <td style="padding:32px;">

            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="
                        padding:14px 18px;
                        background:#fffbeb;
                        border-left:4px solid #f59e0b;
                    ">
                        <strong style="
                            color:#92400e;
                            font-size:14px;
                        ">
                            Action Required
                        </strong>

                        <div style="
                            margin-top:5px;
                            color:#78350f;
                            font-size:13px;
                        ">
                            Please review this request in the admin dashboard.
                        </div>
                    </td>
                </tr>
            </table>

            <!-- REQUESTER -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Requester
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >
                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Employee
                    </td>

                    <td width="25%" style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_name}
                    </td>

                    <td width="20%" style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Email
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_email}
                    </td>
                </tr>
            </table>

            <!-- RESERVATION -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Reservation Details
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Site
                    </td>

                    <td width="25%" style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {site}
                    </td>

                    <td width="20%" style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Travel Date
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {travel_date}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Departure
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {departure_time}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Round Trip
                    </td>

                    <td style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {roundtrip_text}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                    ">
                        Passengers
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                    ">
                        {passenger_count}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                    ">
                        Purpose
                    </td>

                    <td style="
                        padding:13px 0;
                    ">
                        {purpose}
                    </td>
                </tr>

            </table>

            <!-- TRIP -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Trip Information
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Pickup
                    </td>

                    <td width="45%" style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_location}
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_destination}
                    </td>

                    <td style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Return Pickup
                    </td>

                    <td colspan="2" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {return_pickup or "N/A"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                    ">
                        Return Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                    ">
                        {return_drop_off_location or "N/A"}
                    </td>

                    <td style="
                        padding:13px 0;
                    ">
                        {return_map_html}
                    </td>
                </tr>

            </table>

            <p style="
                margin:28px 0 0;
                font-size:13px;
                line-height:1.6;
                color:#64748b;
            ">
                Please log in to the admin dashboard to review and process
                this reservation.
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style="
            padding:18px 32px;
            background:#f8fafc;
            border-top:1px solid #e5e7eb;
        ">
            <span style="
                font-size:11px;
                color:#6b7280;
            ">
                Automated notification from the Ride Reservation System.
                Please do not reply to this email.
            </span>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
"""


def ride_booking_status_email(
    employee_name: str,
    employee_email: str,
    site: str,
    travel_date,
    departure_time,
    roundtrip: bool,
    return_pickup: str | None,
    pickup_location: str,
    pickup_maps_link: str | None,
    dropoff_destination: str,
    drop_off_maps_link: str | None,
    return_drop_off_location: str | None,
    return_drop_off_maps_link: str | None,
    purpose: str,
    passenger_count: int,
    vehicle_type: str | None,
    status: str,
    admin_remarks: str | None,
    admin_name: str | None,
):
    status_upper = status.upper()
    status_title = status.capitalize()
    roundtrip_text = "Yes" if roundtrip else "No"

    if status_upper == "APPROVED":
        status_message = "Your ride reservation has been approved."
        status_background = "#f0fdf4"
        status_border = "#22c55e"
        status_text = "#166534"

    elif status_upper == "REJECTED":
        status_message = "Your ride reservation has been rejected."
        status_background = "#fef2f2"
        status_border = "#ef4444"
        status_text = "#991b1b"

    elif status_upper == "CANCELLED":
        status_message = "Your ride reservation has been cancelled."
        status_background = "#fffbeb"
        status_border = "#f59e0b"
        status_text = "#92400e"

    else:
        status_message = (
            f"Your ride reservation is currently {status.lower()}."
        )
        status_background = "#f8fafc"
        status_border = "#94a3b8"
        status_text = "#334155"

    pickup_map_html = (
        f"""
        <a href="{pickup_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f"""
        <a href="{drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if drop_off_maps_link
        else "Not provided"
    )

    return_map_html = (
        f"""
        <a href="{return_drop_off_maps_link}"
           style="
               color:#03045e;
               font-weight:bold;
               text-decoration:none;
           ">
            View Location
        </a>
        """
        if return_drop_off_maps_link
        else "Not provided"
    )

    vehicle_html = ""

    if status_upper == "APPROVED":
        vehicle_html = f"""
        <tr>
            <td style="
                padding:13px 12px 13px 0;
                color:#64748b;
                border-bottom:1px solid #e5e7eb;
            ">
                Vehicle
            </td>

            <td colspan="3" style="
                padding:13px 0;
                font-weight:600;
                border-bottom:1px solid #e5e7eb;
            ">
                {vehicle_type or "To be assigned"}
            </td>
        </tr>
        """

    remarks_html = ""

    if admin_remarks:
        remarks_html = f"""
        <div style="
            margin-top:28px;
            padding:14px 16px;
            background:#f8fafc;
            border-left:3px solid #94a3b8;
        ">
            <div style="
                font-size:13px;
                font-weight:bold;
                color:#03045e;
                margin-bottom:7px;
            ">
                MESSAGE FROM ADMIN
            </div>

            <div style="
                font-size:14px;
                line-height:1.6;
                color:#475569;
            ">
                {admin_remarks}
            </div>
        </div>
        """

    processed_by_html = ""

    if admin_name:
        processed_by_html = f"""
        <p style="
            margin:22px 0 0;
            font-size:12px;
            color:#64748b;
        ">
            Reviewed by <strong>{admin_name}</strong>.
        </p>
        """

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ride Reservation {status_title}</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#1f2937;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:32px 20px;">

<table
    width="720"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        max-width:720px;
        background:#ffffff;
    "
>

    <!-- HEADER -->
    <tr>
        <td style="
            background:#03045e;
            padding:24px 32px;
            color:#ffffff;
        ">
            <div style="
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:1px;
                color:#bfdbfe;
                margin-bottom:7px;
            ">
                RIDE RESERVATION
            </div>

            <div style="
                font-size:22px;
                font-weight:600;
            ">
                Reservation {status_title}
            </div>
        </td>
    </tr>

    <!-- CONTENT -->
    <tr>
        <td style="padding:32px;">

            <p style="
                margin:0 0 8px;
                font-size:16px;
            ">
                Hello <strong>{employee_name}</strong>,
            </p>

            <!-- STATUS -->
            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin:22px 0 28px;"
            >
                <tr>
                    <td style="
                        padding:15px 18px;
                        background:{status_background};
                        border-left:4px solid {status_border};
                    ">
                        <div style="
                            font-size:15px;
                            font-weight:bold;
                            color:{status_text};
                        ">
                            {status_message}
                        </div>

                        <div style="
                            margin-top:5px;
                            font-size:13px;
                            color:{status_text};
                        ">
                            Status:
                            <strong>{status_upper}</strong>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- RESERVATION -->
            <div style="
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Reservation Details
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Employee
                    </td>

                    <td width="25%" style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_name}
                    </td>

                    <td width="20%" style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Email
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {employee_email}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Site
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {site}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Travel Date
                    </td>

                    <td style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {travel_date}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Departure
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {departure_time}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Round Trip
                    </td>

                    <td style="
                        padding:13px 0;
                        font-weight:600;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {roundtrip_text}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                    ">
                        Passengers
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        font-weight:600;
                    ">
                        {passenger_count}
                    </td>

                    <td style="
                        padding:13px 12px;
                        color:#64748b;
                    ">
                        Purpose
                    </td>

                    <td style="
                        padding:13px 0;
                    ">
                        {purpose}
                    </td>
                </tr>

                {vehicle_html}

            </table>

            <!-- TRIP -->
            <div style="
                margin-top:28px;
                font-size:13px;
                font-weight:bold;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#03045e;
                padding-bottom:10px;
                border-bottom:2px solid #03045e;
            ">
                Trip Information
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="font-size:14px;"
            >

                <tr>
                    <td width="25%" style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Pickup
                    </td>

                    <td width="45%" style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_location}
                    </td>

                    <td width="30%" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {pickup_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_destination}
                    </td>

                    <td style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {dropoff_map_html}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        Return Pickup
                    </td>

                    <td colspan="2" style="
                        padding:13px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        {return_pickup or "N/A"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:13px 12px 13px 0;
                        color:#64748b;
                    ">
                        Return Drop-off
                    </td>

                    <td style="
                        padding:13px 20px 13px 0;
                    ">
                        {return_drop_off_location or "N/A"}
                    </td>

                    <td style="
                        padding:13px 0;
                    ">
                        {return_map_html}
                    </td>
                </tr>

            </table>

            {remarks_html}

            {processed_by_html}

            <p style="
                margin:28px 0 0;
                font-size:13px;
                line-height:1.6;
                color:#64748b;
            ">
                Please keep this email for your records.
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style="
            padding:18px 32px;
            background:#f8fafc;
            border-top:1px solid #e5e7eb;
        ">
            <span style="
                font-size:11px;
                color:#6b7280;
            ">
                Automated notification from the Ride Reservation System.
                Please do not reply to this email.
            </span>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
"""