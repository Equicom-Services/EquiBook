"""
Emails for employee self-service on existing bookings: the one-time
verification code, and the notice site admins get when a requester
cancels or edits their own booking.

The requester's own cancellation/change confirmations reuse the
templates in ``email_templates.py``.
"""

from html import escape


def _layout(
    eyebrow: str,
    title: str,
    booking_id: int,
    content_html: str,
) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(title)}</title>
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
                            {escape(eyebrow)}
                        </div>

                        <div style="
                            font-size:22px;
                            font-weight:600;
                        ">
                            {escape(title)}
                        </div>

                        <div style="
                            margin-top:6px;
                            font-size:13px;
                            color:#dbeafe;
                        ">
                            Booking ID #{booking_id}
                        </div>
                    </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                    <td style="padding:32px;">
                        {content_html}
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
                            Automated notification from the Equibook Reservation System.
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


def verification_code_email(
    employee_name: str,
    booking_label: str,
    booking_id: int,
    code: str,
    action: str,
    expires_minutes: int,
) -> str:
    """
    ``booking_label`` is "room booking" or "ride reservation";
    ``action`` is "cancel" or "edit".
    """
    content = f"""
        <p style="
            margin:0 0 8px;
            font-size:16px;
            color:#111827;
        ">
            Hello {escape(employee_name)},
        </p>

        <p style="
            margin:0 0 24px;
            font-size:14px;
            line-height:1.6;
            color:#4b5563;
        ">
            Use the code below to {escape(action)} your {escape(booking_label)}
            (Booking ID #{booking_id}) on Equibook.
        </p>

        <div style="
            margin:0 0 24px;
            padding:18px;
            background:#f1f5f9;
            border:1px solid #e2e8f0;
            text-align:center;
            font-size:32px;
            font-weight:bold;
            letter-spacing:10px;
            color:#03045e;
        ">
            {escape(code)}
        </div>

        <p style="
            margin:0;
            font-size:13px;
            line-height:1.6;
            color:#6b7280;
        ">
            This code expires in {expires_minutes} minutes. If you did not
            ask for it, you can ignore this email &mdash; your booking
            stays unchanged.
        </p>
    """

    return _layout(
        eyebrow="Booking Verification",
        title="Your verification code",
        booking_id=booking_id,
        content_html=content,
    )


def requester_action_admin_email(
    eyebrow: str,
    title: str,
    intro: str,
    booking_id: int,
    rows: list[tuple[str, str]],
    note: str | None = None,
) -> str:
    """
    Notice to site admins that a requester cancelled or changed
    their own booking. ``rows`` are (label, value) detail pairs.
    """
    rows_html = "".join(
        f"""
            <tr>
                <td width="30%" style="
                    padding:11px 12px 11px 0;
                    color:#64748b;
                    border-bottom:1px solid #e5e7eb;
                    vertical-align:top;
                ">
                    {escape(label)}
                </td>
                <td style="
                    padding:11px 0;
                    font-weight:600;
                    border-bottom:1px solid #e5e7eb;
                    line-height:1.5;
                ">
                    {escape(value)}
                </td>
            </tr>
        """
        for label, value in rows
    )

    note_html = ""

    if note:
        note_html = f"""
            <div style="
                margin-top:24px;
                border-left:4px solid #f59e0b;
                padding:14px 18px;
                background:#fffbeb;
                font-size:13px;
                line-height:1.5;
                color:#78350f;
            ">
                {escape(note)}
            </div>
        """

    content = f"""
        <p style="
            margin:0 0 8px;
            font-size:16px;
            color:#111827;
        ">
            Hello Admin,
        </p>

        <p style="
            margin:0 0 24px;
            font-size:14px;
            line-height:1.6;
            color:#4b5563;
        ">
            {escape(intro)}
        </p>

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="font-size:14px;"
        >
            {rows_html}
        </table>

        {note_html}
    """

    return _layout(
        eyebrow=eyebrow,
        title=title,
        booking_id=booking_id,
        content_html=content,
    )
