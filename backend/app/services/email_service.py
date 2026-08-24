import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings


def send_email(
    recipients: list[str],
    subject: str,
    html_body: str,
):
    msg = MIMEMultipart("alternative")

    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject

    msg.attach(
        MIMEText(html_body, "html")
    )

    with smtplib.SMTP(
        "smtp-relay.gmail.com",
        587,
    ) as server:

        server.starttls()

        # IMPORTANT:
        # Do NOT call server.login()
        # Gmail SMTP Relay is configured without SMTP authentication.

        server.sendmail(
            settings.SMTP_FROM_EMAIL,
            recipients,
            msg.as_string(),
        )