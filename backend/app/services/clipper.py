"""Cut a range out of a stored recording.

The ffmpeg binary ships with the imageio-ffmpeg wheel, so there is nothing to
install on the host. If it is missing or the cut fails, `cut` returns None and
the caller falls back to playing the range against the full recording.
"""

import re
import subprocess
import uuid
from pathlib import Path

from app.services import storage

TIMEOUT_SECONDS = 60


def ffmpeg_path() -> str | None:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def available() -> bool:
    return ffmpeg_path() is not None


def media_duration(source: Path) -> float | None:
    """Length of a media file in seconds, read from ffmpeg's own report."""
    binary = ffmpeg_path()
    if not binary:
        return None

    try:
        result = subprocess.run(
            [binary, "-i", str(source)], capture_output=True, timeout=TIMEOUT_SECONDS
        )
    except (subprocess.SubprocessError, OSError):
        return None

    match = re.search(r"Duration: (\d+):(\d\d):(\d\d\.\d+)", result.stderr.decode("utf-8", "ignore"))
    if not match:
        return None

    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def cut(source: Path, start: float, end: float, suffix: str = ".webm") -> str | None:
    """Write `start`-`end` of `source` to a new stored file; return its name."""
    binary = ffmpeg_path()
    if not binary or end <= start:
        return None

    filename = f"clip-{uuid.uuid4().hex}{suffix}"
    storage.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    destination = storage.MEDIA_ROOT / filename

    command = [
        binary,
        "-y",
        "-ss", str(start),
        "-to", str(end),
        "-i", str(source),
        # Re-encoding keeps the cut accurate; stream copy lands on keyframes and
        # can miss the requested start by seconds, which defeats the point.
        "-c:a", "libopus",
        str(destination),
    ]

    try:
        result = subprocess.run(command, capture_output=True, timeout=TIMEOUT_SECONDS)
    except (subprocess.SubprocessError, OSError):
        destination.unlink(missing_ok=True)
        return None

    if result.returncode != 0 or not destination.exists() or destination.stat().st_size == 0:
        destination.unlink(missing_ok=True)
        return None

    return filename
