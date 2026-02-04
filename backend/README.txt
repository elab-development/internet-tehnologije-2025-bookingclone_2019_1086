BOOKING CLONE – BACKEND (FastAPI)

Requirements:
- Python 3.10+
- Windows / macOS / Linux

--------------------------------------------------
SETUP (FIRST TIME)
--------------------------------------------------

1. Create virtual environment:
   python -m venv venv

2. Activate virtual environment:

   Windows:
     venv\Scripts\activate

   macOS / Linux:
     source venv/bin/activate

3. Install dependencies:
   pip install "fastapi[standard]" sqlmodel aiosqlite passlib PyJWT email-validator bcrypt==4.3.0 uvicorn

--------------------------------------------------
RUNNING THE APPLICATION
--------------------------------------------------

1. Make sure the virtual environment is activated

2. From the project root (backend/), run:
   uvicorn app.main:app --reload

This runs the FastAPI app in development mode with automatic reload on file changes.

--------------------------------------------------
ACCESS
--------------------------------------------------

- API base URL:   http://127.0.0.1:8000
- Swagger UI:    http://127.0.0.1:8000/docs
- ReDoc:         http://127.0.0.1:8000/redoc

--------------------------------------------------
FILE / IMAGE UPLOADS
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

Images are uploaded via multipart/form-data and automatically:
- validated as images
- saved in a folder named after the apartment ID
- renamed using a UUID to avoid filename collisions

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

- Always run commands from the project root (backend/)
- Never run commands from inside the venv/ folder
- Install packages only when the venv is activated
- Database tables are created automatically on application startup
- SQLite database file (database.db) is auto-generated
- Uploaded images are NOT stored in the database (filesystem only)
- Do NOT commit the venv/ directory