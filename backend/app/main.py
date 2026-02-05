from fastapi import FastAPI, Depends
from typing import Annotated
from app.db import db
import app.models
from app.seed import seed_database
from sqlmodel import Session
from sqlmodel.ext.asyncio.session import AsyncSession
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables
    await db.create_tables()

    # seed roles
    async with db.session_factory() as session:
        await seed_database(session)
        await session.commit()

    yield

    await db.engine.dispose()


# Create a FastAPI instance. The 'app' variable is the main point of interaction to create your API.
app = FastAPI(lifespan=lifespan)


SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


# Define a path operation decorator.
# This tells FastAPI that the function below handles GET requests for the "/" path.
@app.get("/")
def read_root():
    """
    Handles GET requests to the root path and returns a JSON response.
    """
    return {"message": "Hello World"}
