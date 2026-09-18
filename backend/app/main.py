import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import action_items, calendar, clips, highlights, meetings, recordings, search
from app.database import Base, SessionLocal, engine
from app.models import Meeting

Base.metadata.create_all(bind=engine)


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


seed_if_empty()

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

for router in (meetings, action_items, highlights, search, clips, calendar, recordings):
    app.include_router(router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
