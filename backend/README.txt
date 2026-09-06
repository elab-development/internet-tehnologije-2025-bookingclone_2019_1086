BOOKING CLONE – BACKEND (FastAPI)

Requirements:
- Python 3.10+
- Windows / macOS / Linux

--------------------------------------------------
SETUP (FIRST TIME)
--------------------------------------------------

1. Go to backend folder:
   cd backend

2. Create virtual environment:
   python -m venv venv

3. Activate virtual environment:

   Windows (PowerShell):
     venv\Scripts\Activate.ps1

   Windows (CMD):
     venv\Scripts\activate.bat

   macOS / Linux:
     source venv/bin/activate

4. Install dependencies:
   pip install "fastapi[standard]" sqlmodel aiosqlite passlib PyJWT email-validator bcrypt==4.3.0 uvicorn alembic python-dotenv

--------------------------------------------------
ENVIRONMENT VARIABLES (.env)
--------------------------------------------------

1. Create file:
   backend/.env


2. Swap from .env example file to .env file and put real values




--------------------------------------------------
DATABASE MIGRATIONS (ALEMBIC)
--------------------------------------------------

IMPORTANT:
Database schema is managed ONLY with Alembic migrations.

--------------------------------------------------
CREATE MIGRATION (WHEN MODELS CHANGE)
--------------------------------------------------

alembic revision --autogenerate -m "your message"

Example:
alembic revision --autogenerate -m "add reservations table"

--------------------------------------------------
APPLY MIGRATIONS (UPDATE DATABASE)
--------------------------------------------------

alembic upgrade head

--------------------------------------------------
CHECK MIGRATION STATUS
--------------------------------------------------

Show current DB version:
alembic current

Show all migrations:
alembic history

Downgrade one migration:
alembic downgrade -1







--------------------------------------------------
RUNNING THE APPLICATION
--------------------------------------------------

1. Make sure the virtual environment is activated

2. From the backend folder run:
   uvicorn app.main:app --reload

This runs the FastAPI app in development mode with automatic reload on file changes.

--------------------------------------------------
ACCESS
--------------------------------------------------

- API base URL:   http://127.0.0.1:8000
- Swagger UI:    http://127.0.0.1:8000/docs
- ReDoc:         http://127.0.0.1:8000/redoc

--------------------------------------------------
STATIC FILES (IMAGES)
--------------------------------------------------

Uploaded images are stored on disk and served as static files.

Directory structure:
static/
 └─ images/
    └─ apartments/
       └─ {apartment_id}/
          ├─ image1.jpg
          ├─ image2.png
          └─ ...

--------------------------------------------------
UPLOAD ENDPOINT
--------------------------------------------------

POST /pictures/{apartment_id}

- Path parameter:
  - apartment_id (int)

- Body (form-data):
  - files (File) → one or more image files
    (use the same key files for multiple images)

Example (curl):

curl -X POST http://127.0.0.1:8000/pictures/42 \
  -F "files=@img1.jpg" \
  -F "files=@img2.png"

--------------------------------------------------
ACCESSING IMAGES
--------------------------------------------------

Images are publicly accessible via:

http://127.0.0.1:8000/static/images/apartments/{apartment_id}/{filename}

Example:
http://127.0.0.1:8000/static/images/apartments/42/a8c1f7e2.jpg

--------------------------------------------------
RESERVATION MAILS (OUTBOX PATTERN)
--------------------------------------------------

Three mails go out, all of them with the details of the reservation:

- guest books   -> guest gets a receipt        (reservation_created)
- guest books   -> host is told about it       (reservation_created_host)
- host answers  -> guest is told confirmed or  (reservation_status_changed)
                   declined

A guest cancelling their own booking sends nothing, they already know.

None of these are sent inside the request.

How it works:

1. POST /reservations saves the reservation AND the outbox_events rows in the
   same transaction. Either all of them are saved or none is, so a mail can
   never be promised for a booking that failed. PATCH /reservations/{id} does
   the same when the host confirms or declines.

2. A background task started in main.py (app/outbox/outbox_worker.py) wakes up
   every OUTBOX_POLL_SECONDS, takes a batch of pending events, and sends them.

3. A send that fails goes back to pending with a later available_at
   (30s, 60s, 120s ... capped at one hour) and is retried on a later pass.
   After OUTBOX_MAX_ATTEMPTS tries the event is left as 'failed' with the
   error in last_error.

outbox_events.status: pending -> processing -> sent / failed

Each event carries recipient_name and recipient_email in its payload, so the
same booking produces one mail for the guest and a different one for the host.
The wording per event type lives in app/services/reservation_email.py.

Mail settings live in .env (SMTP_*). The project uses Zoho on port 587 with
STARTTLS, so SMTP_PASSWORD is an application password, not the account
password. Set MAIL_ENABLED=false to run the app without sending anything.

No extra pip package is needed, sending uses smtplib from the standard library.

To look at the queue:

   sqlite3 database.db "select id, event_type, status, attempts, last_error from outbox_events;"

--------------------------------------------------
DELETING APARTMENTS (SOFT DELETE)
--------------------------------------------------

DELETE /apartments/{id} does not remove the row. It sets apartments.deleted_at
and puts the status to 'inactive', because reservations point at the apartment
and both the guest and the host still have to see what was booked.

A soft deleted apartment is hidden from the apartment lists, from the detail
page, from the calendar and from the photo endpoints, and it cannot be booked
again. It stays visible only through the reservations that reference it, where
the card shows the name without a link.

--------------------------------------------------
NOTES
--------------------------------------------------

- Always run commands from backend/
- Never run commands from inside venv/
- Install packages only when venv is activated
- database.db is created/updated using Alembic
- Uploaded images are stored in filesystem (static/)
- Do NOT commit the venv/ directory
- Do NOT commit database.db (optional, recommended)
