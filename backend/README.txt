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
NOTES
--------------------------------------------------

- Always run commands from backend/
- Never run commands from inside venv/
- Install packages only when venv is activated
- database.db is created/updated using Alembic
- Uploaded images are stored in filesystem (static/)
- Do NOT commit the venv/ directory
- Do NOT commit database.db (optional, recommended)
