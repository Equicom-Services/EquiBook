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
    <html>
        <body style="font-family: Arial, sans-serif; color: #334155;">

            <h2 style="color: #03045e;">
                New Room Booking Request
            </h2>

            <p>
                A new room booking request has been submitted
                and requires your review.
            </p>

            <table cellpadding="8" cellspacing="0">
                <tr>
                    <td><strong>Employee</strong></td>
                    <td>{employee_name}</td>
                </tr>

                <tr>
                    <td><strong>Email</strong></td>
                    <td>{employee_email}</td>
                </tr>

                <tr>
                    <td><strong>Site</strong></td>
                    <td>{site}</td>
                </tr>

                <tr>
                    <td><strong>Room</strong></td>
                    <td>{room}</td>
                </tr>

                <tr>
                    <td><strong>Date</strong></td>
                    <td>{reservation_date}</td>
                </tr>

                <tr>
                    <td><strong>Time</strong></td>
                    <td>
                        {start_time} - {end_time}
                    </td>
                </tr>

                <tr>
                    <td><strong>Purpose</strong></td>
                    <td>{purpose}</td>
                </tr>
            </table>

            <p>
                Please log in to the admin dashboard to
                review this request.
            </p>

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
    status_title = status.capitalize()

    remarks_html = ""

    if remarks:
        remarks_html = f"""
        <tr>
            <td><strong>Remarks</strong></td>
            <td>{remarks}</td>
        </tr>
        """

    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #334155;">

            <h2 style="color: #03045e;">
                Room Booking {status_title}
            </h2>

            <p>
                Hello {employee_name},
            </p>

            <p>
                Your room booking request has been
                <strong>{status.lower()}</strong>.
            </p>

            <table cellpadding="8" cellspacing="0">

                <tr>
                    <td><strong>Site</strong></td>
                    <td>{site}</td>
                </tr>

                <tr>
                    <td><strong>Room</strong></td>
                    <td>{room}</td>
                </tr>

                <tr>
                    <td><strong>Date</strong></td>
                    <td>{reservation_date}</td>
                </tr>

                <tr>
                    <td><strong>Time</strong></td>
                    <td>
                        {start_time} - {end_time}
                    </td>
                </tr>

                <tr>
                    <td><strong>Purpose</strong></td>
                    <td>{purpose}</td>
                </tr>

                {remarks_html}

            </table>

            <p>
                Thank you.
            </p>

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
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Pickup Location
        </a>
        """
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f"""
        <a href="{drop_off_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Drop-off Location
        </a>
        """
        if drop_off_maps_link
        else "Not provided"
    )

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial, Helvetica, sans-serif;
        color:#334155;
    ">

        <div style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
            border:1px solid #e2e8f0;
        ">

            <!-- Header -->
            <div style="
                background:#03045e;
                padding:24px 30px;
                color:#ffffff;
            ">
                <h2 style="
                    margin:0;
                    font-size:22px;
                ">
                    Ride Reservation Submitted
                </h2>

                <p style="
                    margin:8px 0 0;
                    font-size:14px;
                    opacity:0.9;
                ">
                    Your transportation request has been received.
                </p>
            </div>

            <!-- Content -->
            <div style="padding:30px;">

                <p style="margin-top:0;">
                    Hello <strong>{employee_name}</strong>,
                </p>

                <p style="line-height:1.6;">
                    Your ride reservation has been successfully submitted.
                    Please review the details below.
                </p>

                <!-- Status -->
                <div style="
                    background:#fef3c7;
                    border:1px solid #fde68a;
                    padding:14px 16px;
                    border-radius:6px;
                    margin:22px 0;
                ">
                    <strong style="color:#92400e;">
                        Status: Pending Approval
                    </strong>

                    <div style="
                        margin-top:5px;
                        font-size:13px;
                        color:#78350f;
                    ">
                        Your request is currently waiting for approval.
                    </div>
                </div>

                <!-- Reservation Details -->
                <h3 style="
                    color:#03045e;
                    margin-bottom:12px;
                ">
                    Reservation Details
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >

                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Employee</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {employee_name}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Email</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {employee_email}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Site</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {site}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Travel Date</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {travel_date}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Departure Time</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {departure_time}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Round Trip</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {roundtrip_text}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Passengers</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {passenger_count}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Purpose</strong>
                        </td>
                        <td>
                            {purpose}
                        </td>
                    </tr>

                </table>

                <!-- Trip Information -->
                <h3 style="
                    color:#03045e;
                    margin-top:28px;
                    margin-bottom:12px;
                ">
                    Trip Information
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >

                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup Location</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_location}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_destination}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Return Pickup</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {return_pickup or "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Return Drop-off</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {return_drop_off_location or "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Return Drop-off Map</strong>
                        </td>
                        <td>
                            {
                                f'''
                                <a href="{return_drop_off_maps_link}"
                                   style="
                                       display:inline-block;
                                       padding:8px 14px;
                                       background:#03045e;
                                       color:#ffffff;
                                       text-decoration:none;
                                       border-radius:5px;
                                       font-size:13px;
                                   ">
                                    View Return Location
                                </a>
                                '''
                                if return_drop_off_maps_link
                                else "Not provided"
                            }
                        </td>
                    </tr>

                </table>

                <p style="
                    margin-top:28px;
                    line-height:1.6;
                    font-size:14px;
                ">
                    You will receive another email once your request has
                    been reviewed.
                </p>

                <p style="
                    margin-bottom:0;
                    font-size:14px;
                ">
                    Thank you.
                </p>

            </div>

            <!-- Footer -->
            <div style="
                background:#f8fafc;
                padding:18px 30px;
                text-align:center;
                font-size:12px;
                color:#64748b;
            ">
                This is an automated message. Please do not reply to this email.
            </div>

        </div>

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
        f'''
        <a href="{pickup_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Pickup Location
        </a>
        '''
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f'''
        <a href="{drop_off_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Drop-off Location
        </a>
        '''
        if drop_off_maps_link
        else "Not provided"
    )

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial, Helvetica, sans-serif;
        color:#334155;
    ">

        <div style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
            border:1px solid #e2e8f0;
        ">

            <div style="
                background:#03045e;
                padding:24px 30px;
                color:#ffffff;
            ">
                <h2 style="margin:0;">
                    New Ride Reservation Request
                </h2>

                <p style="
                    margin:8px 0 0;
                    font-size:14px;
                ">
                    A new transportation request requires your review.
                </p>
            </div>

            <div style="padding:30px;">

                <div style="
                    background:#fef3c7;
                    border:1px solid #fde68a;
                    padding:14px 16px;
                    border-radius:6px;
                    margin-bottom:24px;
                ">
                    <strong style="color:#92400e;">
                        Action Required
                    </strong>

                    <div style="
                        margin-top:5px;
                        font-size:13px;
                        color:#78350f;
                    ">
                        Please review this request in the admin dashboard.
                    </div>
                </div>

                <h3 style="color:#03045e;">
                    Requester
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >
                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Name</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {employee_name}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Email</strong>
                        </td>
                        <td>
                            {employee_email}
                        </td>
                    </tr>
                </table>

                <h3 style="
                    color:#03045e;
                    margin-top:28px;
                ">
                    Reservation Details
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >
                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Site</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {site}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Travel Date</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {travel_date}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Departure Time</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {departure_time}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Round Trip</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {roundtrip_text}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Passengers</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {passenger_count}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Purpose</strong>
                        </td>
                        <td>
                            {purpose}
                        </td>
                    </tr>
                </table>

                <h3 style="
                    color:#03045e;
                    margin-top:28px;
                ">
                    Trip Information
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >
                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_location}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_destination}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Return Pickup</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {return_pickup or "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Return Drop-off</strong>
                        </td>
                        <td>
                            {return_drop_off_location or "N/A"}
                        </td>
                    </tr>
                </table>

                <p style="
                    margin-top:28px;
                    line-height:1.6;
                    font-size:14px;
                ">
                    Please log in to the admin dashboard to review and
                    process this reservation.
                </p>

            </div>

            <div style="
                background:#f8fafc;
                padding:18px 30px;
                text-align:center;
                font-size:12px;
                color:#64748b;
            ">
                Ride Reservation System
            </div>

        </div>

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
        status_message = (
            "Your ride reservation has been approved."
        )
        status_background = "#dcfce7"
        status_border = "#86efac"
        status_text = "#166534"

    elif status_upper == "REJECTED":
        status_message = (
            "Your ride reservation has been rejected."
        )
        status_background = "#fee2e2"
        status_border = "#fca5a5"
        status_text = "#991b1b"

    elif status_upper == "CANCELLED":
        status_message = (
            "Your ride reservation has been cancelled."
        )
        status_background = "#fef3c7"
        status_border = "#fde68a"
        status_text = "#92400e"

    else:
        status_message = (
            f"Your ride reservation is currently {status.lower()}."
        )
        status_background = "#f1f5f9"
        status_border = "#cbd5e1"
        status_text = "#334155"

    pickup_map_html = (
        f'''
        <a href="{pickup_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Pickup Location
        </a>
        '''
        if pickup_maps_link
        else "Not provided"
    )

    dropoff_map_html = (
        f'''
        <a href="{drop_off_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Drop-off Location
        </a>
        '''
        if drop_off_maps_link
        else "Not provided"
    )

    return_map_html = (
        f'''
        <a href="{return_drop_off_maps_link}"
           style="
               display:inline-block;
               padding:8px 14px;
               background:#03045e;
               color:#ffffff;
               text-decoration:none;
               border-radius:5px;
               font-size:13px;
           ">
            View Return Location
        </a>
        '''
        if return_drop_off_maps_link
        else "Not provided"
    )

    vehicle_html = ""

    if status_upper == "APPROVED":
        vehicle_html = f"""
        <tr>
            <td style="border-bottom:1px solid #e2e8f0;">
                <strong>Vehicle</strong>
            </td>
            <td style="border-bottom:1px solid #e2e8f0;">
                {vehicle_type or "To be assigned"}
            </td>
        </tr>
        """

    remarks_html = ""

    if admin_remarks:
        remarks_html = f"""
        <div style="
            margin-top:24px;
            padding:16px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:6px;
        ">
            <strong style="color:#03045e;">
                Message from Admin
            </strong>

            <p style="
                margin-bottom:0;
                line-height:1.6;
                font-size:14px;
            ">
                {admin_remarks}
            </p>
        </div>
        """

    processed_by_html = ""

    if admin_name:
        processed_by_html = f"""
        <p style="
            margin-top:24px;
            font-size:13px;
            color:#64748b;
        ">
            Reviewed by <strong>{admin_name}</strong>.
        </p>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial, Helvetica, sans-serif;
        color:#334155;
    ">

        <div style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
            border:1px solid #e2e8f0;
        ">

            <div style="
                background:#03045e;
                padding:24px 30px;
                color:#ffffff;
            ">
                <h2 style="
                    margin:0;
                    font-size:22px;
                ">
                    Ride Reservation {status_title}
                </h2>

                <p style="
                    margin:8px 0 0;
                    font-size:14px;
                ">
                    Reservation update
                </p>
            </div>

            <div style="padding:30px;">

                <p style="margin-top:0;">
                    Hello <strong>{employee_name}</strong>,
                </p>

                <!-- Status -->
                <div style="
                    background:{status_background};
                    border:1px solid {status_border};
                    padding:16px;
                    border-radius:6px;
                    margin:22px 0;
                ">
                    <strong style="
                        color:{status_text};
                        font-size:16px;
                    ">
                        {status_message}
                    </strong>

                    <div style="
                        margin-top:6px;
                        color:{status_text};
                        font-size:13px;
                    ">
                        Status: <strong>{status_upper}</strong>
                    </div>
                </div>

                <h3 style="color:#03045e;">
                    Reservation Details
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >

                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Employee</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {employee_name}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Email</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {employee_email}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Site</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {site}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Travel Date</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {travel_date}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Departure Time</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {departure_time}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Round Trip</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {roundtrip_text}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Passengers</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {passenger_count}
                        </td>
                    </tr>

                    {vehicle_html}

                    <tr>
                        <td>
                            <strong>Purpose</strong>
                        </td>
                        <td>
                            {purpose}
                        </td>
                    </tr>

                </table>

                <h3 style="
                    color:#03045e;
                    margin-top:28px;
                ">
                    Trip Information
                </h3>

                <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    style="
                        border-collapse:collapse;
                        font-size:14px;
                    "
                >

                    <tr>
                        <td width="38%"
                            style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_location}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Pickup Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {pickup_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_destination}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Drop-off Map</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {dropoff_map_html}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Return Pickup</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {return_pickup or "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            <strong>Return Drop-off</strong>
                        </td>
                        <td style="border-bottom:1px solid #e2e8f0;">
                            {return_drop_off_location or "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>Return Drop-off Map</strong>
                        </td>
                        <td>
                            {return_map_html}
                        </td>
                    </tr>

                </table>

                {remarks_html}

                {processed_by_html}

                <p style="
                    margin-top:28px;
                    font-size:14px;
                    line-height:1.6;
                ">
                    Please keep this email for your records.
                </p>

                <p style="
                    margin-bottom:0;
                    font-size:14px;
                ">
                    Thank you.
                </p>

            </div>

            <div style="
                background:#f8fafc;
                padding:18px 30px;
                text-align:center;
                font-size:12px;
                color:#64748b;
            ">
                This is an automated message. Please do not reply to this email.
            </div>

        </div>

    </body>
    </html>
    """