import os
from pathlib import Path
from dotenv import load_dotenv


def require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val


def find_env_file() -> Path | None:
    for folder in Path(__file__).resolve().parents:
        candidate = folder / ".env"

        if candidate.is_file():
            return candidate

    return None


def load_env() -> None:
    env_path = find_env_file()

    if env_path:
        load_dotenv(dotenv_path=env_path, override=False)
