"""Runtime AI configuration.

The OpenAI API key is configured strictly from the Settings page (frontend UI).
A saved key is persisted in the database Setting table.

Reading goes through here so a change in the UI applies to the next request
without restarting the server.
"""

import os

from app.database import SessionLocal
from app.models import Setting

API_KEY = "openai_api_key"
SUMMARY_MODEL = "openai_model"
TRANSCRIBE_MODEL = "transcribe_model"

DEFAULT_SUMMARY_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
DEFAULT_TRANSCRIBE_MODEL = os.getenv("TRANSCRIBE_MODEL", "whisper-1")

# Offered when the account's model list cannot be fetched.
FALLBACK_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]
TRANSCRIBE_MODELS = ["whisper-1", "gpt-4o-mini-transcribe", "gpt-4o-transcribe"]


def read(key: str) -> str | None:
    db = SessionLocal()
    try:
        row = db.get(Setting, key)
        return row.value if row and row.value else None
    finally:
        db.close()


def write(key: str, value: str | None) -> None:
    db = SessionLocal()
    try:
        row = db.get(Setting, key)
        if not value:
            if row:
                db.delete(row)
        else:
            if row:
                row.value = value
            else:
                db.add(Setting(key=key, value=value))
        db.commit()
    finally:
        db.close()


def api_key() -> str | None:
    return read(API_KEY) or None


def key_source() -> str:
    return "saved" if read(API_KEY) else "none"


def summary_model() -> str:
    return read(SUMMARY_MODEL) or DEFAULT_SUMMARY_MODEL


def transcribe_model() -> str:
    return read(TRANSCRIBE_MODEL) or DEFAULT_TRANSCRIBE_MODEL
