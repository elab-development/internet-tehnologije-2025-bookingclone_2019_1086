from app.shared.database_connection import DatabaseConnection
from app.shared.env_loader import require_env


DATABASE_URL = require_env("DATABASE_URL")

# SINGLE shared db instance for whole app
db = DatabaseConnection(DATABASE_URL, echo=True)
