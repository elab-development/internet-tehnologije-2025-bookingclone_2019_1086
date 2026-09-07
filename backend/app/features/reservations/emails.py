from __future__ import annotations

from html import escape
from typing import Any

from app.enums.outbox_status_enum import OutboxEventType
from app.enums.reservation_status_enum import ReservationStatus


SIGN_OFF = "Booking team"


def format_date(value: str) -> str:
    """ISO date from the payload into something a guest wants to read."""
    parts = value.split("-")

    if len(parts) != 3:
        return value

    return f"{parts[2]}.{parts[1]}.{parts[0]}."


def build_detail_lines(payload: dict[str, Any]) -> list[tuple[str, str]]:
    """The facts of the booking, shown the same way in every mail."""
    return [
        ("Reservation number", f"#{payload['reservation_id']}"),
        ("Apartment", str(payload["apartment_title"])),
        (
            "Address",
            f"{payload['apartment_address']}, {payload['apartment_city']}, "
            f"{payload['apartment_country']}",
        ),
        ("Check-in", format_date(payload["check_in"])),
        ("Check-out", format_date(payload["check_out"])),
        ("Nights", str(payload["nights"])),
        ("Guests", str(payload["guests_count"])),
        ("Total price", f"{payload['total_price']} EUR"),
    ]


# --- what each mail says -------------------------------------------------


def guest_created_copy(payload: dict[str, Any]) -> tuple[str, str, str, str]:
    return (
        f"Your reservation at {payload['apartment_title']} is booked",
        f"We received your reservation for {payload['apartment_title']}.",
        f"{payload['host_name']} still has to confirm the reservation. We will"
        " let you know as soon as that happens.",
        "See reservation status",
    )


def host_created_copy(payload: dict[str, Any]) -> tuple[str, str, str, str]:
    return (
        f"New reservation for {payload['apartment_title']}",
        f"{payload['guest_name']} ({payload['guest_email']}) booked"
        f" {payload['apartment_title']}.",
        "The dates are held for now. Use the link to confirm or decline the"
        " booking.",
        "Confirm or decline",
    )


def guest_status_copy(payload: dict[str, Any]) -> tuple[str, str, str, str]:
    if payload["status"] == ReservationStatus.CONFIRMED.value:
        return (
            f"Your reservation at {payload['apartment_title']} is confirmed",
            f"Good news: {payload['host_name']} confirmed your reservation for"
            f" {payload['apartment_title']}.",
            "Everything is set. Have a nice stay!",
            "See reservation status",
        )

    return (
        f"Your reservation at {payload['apartment_title']} was declined",
        f"{payload['host_name']} could not take your reservation for"
        f" {payload['apartment_title']}, so it has been cancelled.",
        "You have not been charged. Have a look at the other apartments, there"
        " is probably something free on the same dates.",
        "See reservation status",
    )


COPY_BY_EVENT_TYPE = {
    OutboxEventType.RESERVATION_CREATED.value: guest_created_copy,
    OutboxEventType.RESERVATION_CREATED_HOST.value: host_created_copy,
    OutboxEventType.RESERVATION_STATUS_CHANGED.value: guest_status_copy,
}


# --- turning the copy into a mail ---------------------------------------


def build_text_body(
    payload: dict[str, Any], lead: str, closing: str, action: str
) -> str:
    lines = [f"Hi {payload['recipient_name']},", "", lead, "", "RESERVATION DETAILS"]

    for label, value in build_detail_lines(payload):
        lines.append(f"{label}: {value}")

    lines += [f"Status: {payload['status']}", "", closing]

    # Plain text has no buttons, so the address is spelled out in full.
    link = payload.get("reservation_link")

    if link:
        lines += ["", f"{action}: {link}"]

    lines += ["", SIGN_OFF]

    return "\n".join(lines)


def build_row(label: str, value: str) -> str:
    return (
        "<tr>"
        '<td style="padding:8px 0;color:#6b7280;font-size:14px;">'
        f"{escape(label)}</td>"
        '<td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;'
        'text-align:right;">'
        f"{escape(value)}</td>"
        "</tr>"
    )


def build_button(payload: dict[str, Any], action: str) -> str:
    """The link, as something clickable."""
    link = payload.get("reservation_link")

    if not link:
        return ""

    return f"""
          <table role="presentation" cellpadding="0" cellspacing="0"
                 style="margin:24px 0 0;">
            <tr>
              <td style="border-radius:8px;background:#2563eb;">
                <a href="{escape(str(link), quote=True)}"
                   style="display:inline-block;padding:12px 22px;color:#ffffff;
                          font-size:15px;font-weight:600;text-decoration:none;">
                  {escape(action)}
                </a>
              </td>
            </tr>
          </table>"""


def build_html_body(
    payload: dict[str, Any], lead: str, closing: str, action: str
) -> str:
    rows = "".join(
        build_row(label, value) for label, value in build_detail_lines(payload)
    )
    rows += build_row("Status", str(payload["status"]))

    return f"""<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f3f4f6;
               font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;margin:0 auto;background:#ffffff;
                  border-radius:12px;padding:32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">
            Hi {escape(str(payload["recipient_name"]))},
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.5;">
            {escape(lead)}
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border-top:1px solid #e5e7eb;">
            {rows}
          </table>

          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.5;">
            {escape(closing)}
          </p>
          {build_button(payload, action)}
          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
            {escape(SIGN_OFF)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def build_message(event_type: str, payload: dict[str, Any]) -> tuple[str, str, str]:
    """Subject, plain text and html for one event."""
    build_copy = COPY_BY_EVENT_TYPE.get(event_type)

    if not build_copy:
        raise ValueError(f"Unknown event type: {event_type}")

    subject, lead, closing, action = build_copy(payload)

    return (
        subject,
        build_text_body(payload, lead, closing, action),
        build_html_body(payload, lead, closing, action),
    )
