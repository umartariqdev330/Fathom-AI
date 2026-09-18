from app.seed.base import (
    ALEX,
    AYESHA,
    CHRIS,
    DANIEL,
    EMMA,
    JAMES,
    MUHAMMAD,
    NADIA,
    PRIYA,
    RYAN,
    SAMPLE_VIDEO,
    SARAH,
    TOM,
    VICTOR,
    build_segments,
)

UPCOMING = [
    {
        "title": "Northwind Renewal - Search Demo",
        "description": "Live demo of cross-meeting keyword search ahead of the renewal decision.",
        "meeting_type": "External",
        "platform": "Microsoft Teams",
        "days_ahead": 1,
        "hour": 14,
        "duration": 2700,
        "participants": [TOM, MUHAMMAD, SARAH, PRIYA, JAMES],
    },
    {
        "title": "Weekly Engineering Standup",
        "description": "Blockers, then status. Twenty minutes.",
        "meeting_type": "Internal",
        "platform": "Zoom",
        "days_ahead": 2,
        "hour": 9,
        "duration": 1200,
        "participants": [MUHAMMAD, ALEX, AYESHA, VICTOR, DANIEL],
    },
    {
        "title": "Helio Health - Redaction Scoping",
        "description": "Walk through the redaction requirements gathered in the feedback session.",
        "meeting_type": "External",
        "platform": "Microsoft Teams",
        "days_ahead": 3,
        "hour": 12,
        "duration": 3000,
        "participants": [SARAH, EMMA, DANIEL, NADIA, CHRIS],
    },
    {
        "title": "Board Prep - Q4 Commitments",
        "description": "Walk the three-feature commitment and the revised margin model before the board.",
        "meeting_type": "Internal",
        "platform": "Google Meet",
        "days_ahead": 5,
        "hour": 16,
        "duration": 3600,
        "participants": [RYAN, SARAH, MUHAMMAD],
    },
    {
        "title": "Sprint 35 Planning",
        "description": "Transcript export is first on the candidate list this time.",
        "meeting_type": "Internal",
        "platform": "Google Meet",
        "days_ahead": 8,
        "hour": 11,
        "duration": 2880,
        "participants": [MUHAMMAD, ALEX, AYESHA, VICTOR, DANIEL, SARAH],
    },
]


# Used by the simulated recording flow. Stopping a recording produces a real
# meeting from this transcript, summarised through the same AI service that
# every other summary goes through.
SIMULATED_RECORDING = {
    "title": "Pipeline Sync",
    "description": "Recorded with Meetly. Capture is simulated for this build.",
    "meeting_type": "Internal",
    "recording_url": SAMPLE_VIDEO,
    "participants": [MUHAMMAD, AYESHA, ALEX],
    "blocks": [
        {
            "title": "Status",
            "start": 0,
            "lines": [
                (MUHAMMAD["name"], "Short sync on the pipeline. Ayesha, where did the parallel fan-out land?"),
                (AYESHA["name"], "Working. Nine chunks in parallel plus the merge finishes in about ninety seconds on the longest meeting we have."),
                (ALEX["name"], "And when a chunk fails we need to merge what is there and mark the summary partial rather than failing the whole thing."),
                (AYESHA["name"], "That is in. Two retries per chunk, then merge partial with the failed time range attached so the interface can name it."),
                (MUHAMMAD["name"], "Good. Can you write up the retry policy so support knows what to tell people?"),
                (AYESHA["name"], "I will do that today."),
                (ALEX["name"], "One open question. Do we regenerate a partial summary automatically when the provider recovers, or leave it to the user?"),
                (MUHAMMAD["name"], "Leave it to the user for now. Silent regeneration changes a document someone may have already read."),
            ],
        },
    ],
}

SIMULATED_RECORDING["segments"] = build_segments(SIMULATED_RECORDING["blocks"])
