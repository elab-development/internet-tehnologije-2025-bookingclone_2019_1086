from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr


class MailConfigurationError(RuntimeError):
    """SMTP settings are missing from .env, so nothing can be sent."""


def read_setting(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def is_mail_enabled() -> bool:
    # Lets a developer run the app without a mailbox: events are still written
    # and the worker still walks them, it just does not open a connection.
    return read_setting("MAIL_ENABLED", "true").lower() == "true"


def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> None:
    """Send one mail over SMTP. Blocking, so callers run it in a worker thread."""
    host = read_setting("SMTP_HOST")
    username = read_setting("SMTP_USERNAME")
    password = read_setting("SMTP_PASSWORD")

    if not host or not username or not password:
        raise MailConfigurationError(
            "SMTP_HOST, SMTP_USERNAME and SMTP_PASSWORD must be set in .env"
        )

    port = int(read_setting("SMTP_PORT", "587"))
    timeout = int(read_setting("SMTP_TIMEOUT_SECONDS", "30"))
    from_name = read_setting("SMTP_FROM_NAME", "Booking")
    from_email = read_setting("SMTP_FROM_EMAIL", username)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((from_name, from_email))
    message["To"] = formataddr((to_name, to_email))

    # Plain text first, HTML as the richer alternative for clients that show it.
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(host, port, timeout=timeout) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(username, password)
        smtp.send_message(message)
