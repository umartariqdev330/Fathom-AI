import os

# Ensure OpenAI API key is never read from environment variables
os.environ.pop("OPENAI_API_KEY", None)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    action_items,
    calendar,
    clips,
    highlights,
    meetings,
    recordings,
    search,
    settings,
)
from app.database import Base, SessionLocal, engine, ensure_columns
from app.models import Clip, Meeting
from app.services import storage

Base.metadata.create_all(bind=engine)
ensure_columns()


def seed_if_empty() -> None:
    """Seed on first boot.

    Deployment targets that give the app a fresh disk would otherwise serve an
    empty workspace, and an empty meetings list shows nothing about the product.
    """
    db = SessionLocal()
    try:
        if db.query(Meeting).count() == 0:
            from seed import main as run_seed

            run_seed()
    finally:
        db.close()


def sweep_orphaned_media() -> None:
    """Drop media files no meeting or clip references any more."""
    db = SessionLocal()
    try:
        referenced = {
            name
            for (name,) in db.query(Meeting.media_filename).union(db.query(Clip.media_filename))
            if name
        }
        storage.remove_unreferenced(referenced)
    finally:
        db.close()


seed_if_empty()
sweep_orphaned_media()

app = FastAPI(title="Meetly AI", version="1.0.0")

# Comma-separated list in production, e.g. "https://meetly.vercel.app"
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (meetings, action_items, highlights, search, clips, calendar, recordings, settings):
    app.include_router(router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
