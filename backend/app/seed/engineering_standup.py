from app.seed.base import SARAH, MUHAMMAD, ALEX, DANIEL, AYESHA, RYAN


ENGINEERING_STANDUP = {
    "title": "Weekly Engineering Standup",
    "description": "Blockers on the transcript chunking work and the staging deploy that went sideways.",
    "meeting_type": "Internal",
    "platform": "Zoom",
    "days_ago": 2,
    "hour": 9,
    "participants": [MUHAMMAD, ALEX, AYESHA, RYAN, DANIEL, SARAH],
    "blocks": [
        {
            "title": "Round the room",
            "start": 0,
            "lines": [
                (MUHAMMAD["name"], "Quick one today, twenty minutes. Blockers first, status after. Alex, you go."),
                (ALEX["name"], "Blocked, and it is my own fault. The staging deploy on Friday took the transcript service down for about forty minutes and I have been in the postmortem since."),
                (MUHAMMAD["name"], "What actually broke?"),
                (ALEX["name"], "Migration ordering. I added a not-null column to transcript_segments and the old pods were still writing rows without it. Classic, and entirely avoidable."),
                (RYAN["name"], "Did any customer data get lost?"),
                (ALEX["name"], "No. Writes failed loudly and the queue retried once the migration finished. We lost availability, not data. Roughly two hundred segments were delayed by forty minutes."),
                (RYAN["name"], "Then it is a bad Friday, not an incident. Write it up, but do not spend three days on it."),
            ],
        },
        {
            "title": "Chunking progress",
            "start": 460,
            "lines": [
                (AYESHA["name"], "I have the chunked summarisation working end to end on the eight-person architecture call, which is the worst case we have. Sixty-two minutes, about nine thousand words."),
                (MUHAMMAD["name"], "And the output quality?"),
                (AYESHA["name"], "Better than I expected. The merge pass is doing real work, it deduplicates decisions that got restated three times across the call."),
                (AYESHA["name"], "What is not working is speaker attribution in the merged summary. When two people argue a point across twenty minutes the merge picks one name and drops the other."),
                (ALEX["name"], "Is that a prompt problem or a data problem?"),
                (AYESHA["name"], "Prompt. I am passing chunks without speaker turn counts, so the model has no way to know the discussion was contested. I am adding that this afternoon."),
                (MUHAMMAD["name"], "Good. Do not let it turn into a week. If the attribution is still wrong on Wednesday we ship without it and fix it after."),
            ],
        },
        {
            "title": "Design and close",
            "start": 900,
            "lines": [
                (DANIEL["name"], "Nothing blocking me. The detail page prototype is about two thirds done, I will have something clickable for Thursday."),
                (SARAH["name"], "One ask from me. Tom has the Northwind renewal call on Thursday and he wants to demo search. Is the keyword version demo-safe?"),
                (MUHAMMAD["name"], "Demo-safe yes, production-safe no. It has no pagination, so a query matching four hundred segments will hang the page."),
                (SARAH["name"], "Can you cap it before Thursday?"),
                (MUHAMMAD["name"], "I will cap results at sixty and add a count. Half a day."),
                (MUHAMMAD["name"], "That is everything. Alex, postmortem by Wednesday, Ayesha, attribution by Wednesday or we cut it."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "Standup was dominated by two threads: the Friday staging deploy that took the "
            "transcript service down for forty minutes, and progress on chunked summarisation, "
            "which now works end to end on the longest meeting in the corpus but attributes "
            "contested points to a single speaker."
        ),
        "key_points": [
            "Friday outage was a migration ordering error, not data loss. Writes failed loudly and retried.",
            "Chunked summarisation works on the 62-minute, 9,000-word architecture call.",
            "The merge pass deduplicates restated decisions, which was an unplanned benefit.",
            "Keyword search is demo-safe but will hang on queries matching hundreds of segments.",
        ],
        "decisions": [
            "The Friday outage is written up as a postmortem, not run as a full incident.",
            "Speaker attribution in merged summaries gets until Wednesday, then ships without it.",
            "Search results capped at 60 with a total count before Thursday's Northwind demo.",
        ],
        "topics": ["Deploy Incident", "Summarisation", "Search", "Blockers"],
        "insights": [
            "Both engineering blockers this week trace to the same root cause: work shipped without the slow path being tested at realistic scale.",
            "Ayesha volunteered a time box without being asked. Muhammad still tightened it, which suggests estimates here run optimistic.",
        ],
    },
    "action_items": [
        {"task": "Write up the Friday staging deploy postmortem", "assignee": "Alex Johnson", "due_date": "Sep 24", "status": "done", "timestamp": 400},
        {"task": "Add speaker turn counts to summarisation chunks", "assignee": "Ayesha Malik", "due_date": "Sep 24", "status": "open", "timestamp": 780},
        {"task": "Cap search results at 60 and show a total count", "assignee": "Muhammad Umar", "due_date": "Sep 25", "status": "open", "timestamp": 1120},
        {"task": "Clickable detail page prototype for Thursday", "assignee": "Daniel Kim", "due_date": "Sep 25", "status": "open", "timestamp": 920},
    ],
    "highlights": [
        {"title": "Outage was availability, not data loss", "quote": "We lost availability, not data", "speaker": "Alex Johnson", "category": "risk"},
        {"title": "Merge pass deduplicates restated decisions", "quote": "deduplicates decisions", "speaker": "Ayesha Malik", "category": "insight"},
        {"title": "Search will hang on large result sets", "quote": "will hang the page", "speaker": "Muhammad Umar", "category": "risk"},
    ],
}
