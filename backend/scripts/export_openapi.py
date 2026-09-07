# -*- coding: utf-8 -*-
"""Write the OpenAPI document to backend/openapi.json.

The specification is generated from the routes, so a copy in the repository
goes stale the moment a route changes. This script regenerates it, and is meant
to be run whenever the API changes:

    cd backend
    python scripts/export_openapi.py

The application is imported, never started: no server, no port, no database
connection is opened. That makes the file safe to regenerate in a pipeline as
well, where nothing is running.
"""

import json
import sys
from pathlib import Path

# Run as a script from backend/, so the package has to be findable.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.shared.env_loader import load_env

load_env()

from app.main import app


OUTPUT_PATH = BACKEND_DIR / "openapi.json"


def main() -> None:
    spec = app.openapi()

    # ensure_ascii off, so Serbian text in the descriptions stays readable when
    # somebody opens the file instead of feeding it to a tool.
    OUTPUT_PATH.write_text(
        json.dumps(spec, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    operations = sum(len(methods) for methods in spec["paths"].values())

    print(f"upisano: {OUTPUT_PATH}")
    print(f"putanja: {len(spec['paths'])}, operacija: {operations}")
    print(f"modela: {len(spec['components']['schemas'])}")


if __name__ == "__main__":
    main()
