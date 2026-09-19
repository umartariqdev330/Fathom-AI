"""AI settings, configurable from the Settings page.

The key is never sent back to the browser. Only a masked form, enough to
confirm which key is in use without handing it out again.
"""

import re

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import config

router = APIRouter(prefix="/api/settings", tags=["settings"])

MODELS_URL = "https://api.openai.com/v1/models"

# Audio, image and search variants cannot answer a summarisation prompt.
NON_CHAT = re.compile(r"audio|realtime|transcribe|tts|search|image|embed|moderation")
# Dated snapshots like gpt-4o-2024-08-06 add rows without adding a real choice.
DATED_SNAPSHOT = re.compile(r"-\d{4}-\d{2}-\d{2}$|-\d{4}$")


class AiSettings(BaseModel):
    configured: bool
    key_source: str  # saved | none
    masked_key: str | None = None
    summary_model: str
    transcribe_model: str
    transcribe_models: list[str]


class AiSettingsUpdate(BaseModel):
    # None leaves a field alone; "" clears the saved key.
    api_key: str | None = None
    summary_model: str | None = None
    transcribe_model: str | None = None


class TestResult(BaseModel):
    ok: bool
    detail: str


def mask(key: str) -> str:
    return f"{key[:6]}…{key[-4:]}" if len(key) > 12 else "…"


def current() -> AiSettings:
    key = config.api_key()
    return AiSettings(
        configured=bool(key),
        key_source=config.key_source(),
        masked_key=mask(key) if key else None,
        summary_model=config.summary_model(),
        transcribe_model=config.transcribe_model(),
        transcribe_models=config.TRANSCRIBE_MODELS,
    )


@router.get("/ai", response_model=AiSettings)
def get_ai_settings():
    return current()


@router.put("/ai", response_model=AiSettings)
def update_ai_settings(payload: AiSettingsUpdate):
    if payload.api_key is not None:
        key = payload.api_key.strip()
        if key and not key.startswith("sk-"):
            raise HTTPException(status_code=400, detail="An OpenAI key starts with 'sk-'")
        config.write(config.API_KEY, key or None)

    if payload.summary_model:
        config.write(config.SUMMARY_MODEL, payload.summary_model.strip())
    if payload.transcribe_model:
        config.write(config.TRANSCRIBE_MODEL, payload.transcribe_model.strip())

    return current()


@router.get("/ai/models", response_model=list[str])
def list_models():
    """Chat models this account can actually use, straight from OpenAI."""
    key = config.api_key()
    if not key:
        return config.FALLBACK_MODELS

    try:
        response = httpx.get(
            MODELS_URL, headers={"Authorization": f"Bearer {key}"}, timeout=15
        )
        response.raise_for_status()
        ids = [m["id"] for m in response.json().get("data", [])]
    except Exception:
        return config.FALLBACK_MODELS

    chat = [
        model
        for model in ids
        if model.startswith(("gpt-", "o1", "o3", "o4"))
        and not NON_CHAT.search(model)
        and not DATED_SNAPSHOT.search(model)
    ]
    return sorted(set(chat)) or config.FALLBACK_MODELS


@router.post("/ai/test", response_model=TestResult)
def test_connection():
    """Confirm the configured key actually works before relying on it."""
    key = config.api_key()
    if not key:
        return TestResult(ok=False, detail="No API key is configured.")

    try:
        response = httpx.get(
            MODELS_URL, headers={"Authorization": f"Bearer {key}"}, timeout=15
        )
    except httpx.HTTPError:
        return TestResult(ok=False, detail="Could not reach OpenAI. Check your connection.")

    if response.status_code == 401:
        return TestResult(ok=False, detail="OpenAI rejected this key.")
    if response.status_code != 200:
        return TestResult(ok=False, detail=f"OpenAI returned {response.status_code}.")

    return TestResult(ok=True, detail=f"Key works. Using {config.summary_model()} for summaries.")
