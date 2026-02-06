from logging.config import fileConfig
from pathlib import Path
import sys

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))

from app.env_loader import load_env, require_env

load_env()
import app.models  # noqa

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

db_url = require_env("DATABASE_URL")

# alembic must use sync sqlite
if db_url.startswith("sqlite+aiosqlite"):
    db_url = db_url.replace("sqlite+aiosqlite", "sqlite", 1)

# make relative sqlite path absolute
if db_url.startswith("sqlite:///") and not db_url.startswith("sqlite:////"):
    rel = db_url.replace("sqlite:///", "", 1)
    abs_path = (BASE_DIR / rel).resolve()
    db_url = f"sqlite:///{abs_path.as_posix()}"

config.set_main_option("sqlalchemy.url", db_url)

target_metadata = SQLModel.metadata

connectable = engine_from_config(
    config.get_section(config.config_ini_section, {}),
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
)

with connectable.connect() as connection:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()
