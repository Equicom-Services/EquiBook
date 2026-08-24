import smtplib
from email.mime.text import MIMEText

SMTP_HOST = "smtp-relay.gmail.com"
SMTP_PORT = 587

FROM_EMAIL = "notification.alert@equicomservices.com"
TO_EMAIL = "hero.baceles@equicomservices.com"

msg = MIMEText(
    "This is a test email from the Equibook server.",
    "plain",
)

msg["From"] = FROM_EMAIL
msg["To"] = TO_EMAIL
msg["Subject"] = "Equibook SMTP Test"

print(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:

        print("Connected to SMTP server.")

        server.set_debuglevel(1)

        print("Starting TLS...")
        server.starttls()

        print("TLS established.")
        print("Sending email...")

        server.sendmail(
            FROM_EMAIL,
            [TO_EMAIL],
            msg.as_string(),
        )

        print("SUCCESS: Email sent.")

except Exception as e:
    print("FAILED:")
    print(type(e).__name__)
    print(e)