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
from app.models import Clip, Meeting, Setting
from app.services import storage

Base.metadata.create_all(bind=engine)
ensure_columns()


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


def seed_if_untouched() -> None:
    """Give a brand-new deployment something to show.

    Only fires on a database nobody has touched: no meetings and no saved
    settings. Seeding drops and recreates the tables, so the settings check is
    what stops a restart from wiping an API key after every meeting has been
    deleted by hand.
    """
    db = SessionLocal()
    try:
        fresh = db.query(Meeting).count() == 0 and db.query(Setting).count() == 0
    finally:
        db.close()

    if fresh:
        from seed import main as run_seed

        run_seed(demo=True)


seed_if_untouched()
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
