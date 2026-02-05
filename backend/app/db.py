from app.database_connection import DatabaseConnection

DATABASE_URL = "sqlite+aiosqlite:///database.db"

# SINGLE shared db instance for whole app
db = DatabaseConnection(DATABASE_URL, echo=True)
