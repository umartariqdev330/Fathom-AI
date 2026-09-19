"""Media storage.

Local disk today. The interface is deliberately three functions so swapping in
object storage later means writing those three against S3, not reworking callers.
"""

import os
import uuid
from pathlib import Path

MEDIA_ROOT = Path(os.getenv("MEDIA_STORAGE_PATH", "media"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024

# Browsers produce webm/ogg from MediaRecorder; mp4 and wav cover the rest.
ALLOWED_MIME = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "video/webm": ".webm",
}


class UploadRejected(Exception):
    """The upload is not something we are willing to store."""


def save(data: bytes, mime: str) -> str:
    """Store bytes under a generated name and return that name.

    The client's filename is never used: it is attacker-controlled and only ever
    a path-traversal risk.
    """
    extension = ALLOWED_MIME.get(mime.split(";")[0].strip())
    if not extension:
        raise UploadRejected(f"Unsupported audio format: {mime}")
    if not data:
        raise UploadRejected("The recording was empty")
    if len(data) > MAX_UPLOAD_BYTES:
        raise UploadRejected(f"Recording is larger than {MAX_UPLOAD_BYTES // 1024 // 1024}MB")

    filename = f"{uuid.uuid4().hex}{extension}"
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    (MEDIA_ROOT / filename).write_bytes(data)
    return filename


def path_for(filename: str) -> Path | None:
    """Absolute path of a stored file, or None when it is gone."""
    if not filename:
        return None
    # Guard against a stored name that somehow escapes the media directory.
    path = (MEDIA_ROOT / Path(filename).name).resolve()
    return path if path.is_file() else None


def remove_unreferenced(keep: set[str]) -> int:
    """Delete stored files nothing points at any more.

    A file that was locked when its meeting was deleted stays behind, so
    without this the media directory only ever grows.
    """
    if not MEDIA_ROOT.is_dir():
        return 0

    removed = 0
    for path in MEDIA_ROOT.iterdir():
        if path.is_file() and path.name not in keep and delete(path.name):
            removed += 1
    return removed


def delete(filename: str) -> bool:
    """Best effort. Returns False if the file is still there.

    Windows refuses to unlink a file another process still has open, so a file
    being streamed to a player cannot be removed right then. Losing a few bytes
    to a later cleanup is better than failing the delete the user asked for.
    """
    path = path_for(filename)
    if not path:
        return True
    try:
        path.unlink()
        return True
    except OSError:
        return False
