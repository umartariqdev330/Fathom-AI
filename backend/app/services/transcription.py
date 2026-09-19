"""Speech to text.

With an OPENAI_API_KEY the audio goes to Whisper and comes back with real
per-segment timestamps. Without one there is nothing honest to return, so the
fallback produces a single segment that says exactly that rather than inventing
a conversation.
"""

import os
from pathlib import Path

from openai import OpenAI

MODEL = os.getenv("TRANSCRIBE_MODEL", "whisper-1")

NO_KEY_NOTICE = (
    "Transcription is unavailable: no OPENAI_API_KEY is configured on the server. "
    "The audio was recorded and stored, but nothing has been transcribed. "
    "Set a key and re-record to see a real transcript here."
)


def available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def transcribe(path: Path) -> list[dict]:
    """Return [{speaker, start_time, end_time, text}, ...] ordered by start time."""
    if not available():
        return [_notice(path)]

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    with path.open("rb") as audio:
        result = client.audio.transcriptions.create(
            model=MODEL,
            file=audio,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = getattr(result, "segments", None) or []
    speaker = os.getenv("DEFAULT_SPEAKER", "Speaker 1")

    transcript = [
        {
            "speaker": speaker,
            "start_time": float(segment.start),
            "end_time": float(segment.end),
            "text": segment.text.strip(),
        }
        for segment in segments
        if segment.text.strip()
    ]

    # Some short clips come back as plain text with no segment breakdown.
    if not transcript and getattr(result, "text", "").strip():
        transcript = [
            {
                "speaker": speaker,
                "start_time": 0.0,
                "end_time": float(getattr(result, "duration", 0) or 0) or 1.0,
                "text": result.text.strip(),
            }
        ]

    return transcript


def _notice(path: Path) -> dict:
    seconds = max(1.0, path.stat().st_size / 16000)  # rough, only to give the row a length
    return {"speaker": "Meetly", "start_time": 0.0, "end_time": seconds, "text": NO_KEY_NOTICE}
