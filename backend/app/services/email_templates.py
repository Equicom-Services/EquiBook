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