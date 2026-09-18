from app.seed.base import CHRIS, DANIEL, EMMA, NADIA, SARAH


CUSTOMER_FEEDBACK = {
    "title": "Customer Feedback Session - Helio Health",
    "description": "Clinical team walkthrough. Consent, redaction, and why they stopped using highlights.",
    "meeting_type": "External",
    "platform": "Microsoft Teams",
    "days_ago": 16,
    "hour": 12,
    "participants": [EMMA, DANIEL, SARAH, NADIA, CHRIS],
    "blocks": [
        {
            "title": "How they actually use it",
            "start": 0,
            "lines": [
                (EMMA["name"], "Nadia, Chris, thank you. Daniel is on design and Sarah on product, and we would rather hear what is wrong than what is fine."),
                (NADIA["name"], "Then I will start with what is wrong. We use this for internal clinical governance meetings, not patient consultations, and the distinction matters enormously."),
                (NADIA["name"], "Every so often a clinician mentions a patient by name in passing. When that happens the whole recording becomes a record we are not allowed to keep casually."),
                (SARAH["name"], "What do you do today when that happens?"),
                (CHRIS["name"], "We delete the entire meeting. There is no way to remove thirty seconds, so we lose the other fifty-five minutes with it."),
                (DANIEL["name"], "That is a significant gap and I do not think we have heard it framed that starkly before."),
                (NADIA["name"], "It happens maybe twice a month. Twice a month we throw away a governance record because of one sentence."),
            ],
        },
        {
            "title": "Redaction",
            "start": 620,
            "lines": [
                (SARAH["name"], "If you could select a range and redact it, what would you expect to happen to the audio, the transcript, and the summary?"),
                (NADIA["name"], "All three. Audio silenced, transcript segment removed, and the summary regenerated without it. If the summary still references it the redaction is worthless."),
                (CHRIS["name"], "And an audit entry. I need to be able to show that a redaction happened, who did it, and when. Not what was removed, just that it was."),
                (EMMA["name"], "That is a clean requirement. Do you need the audio to be truly gone or just inaccessible?"),
                (CHRIS["name"], "Truly gone. Inaccessible is not good enough for our retention policy."),
                (DANIEL["name"], "Regenerating the summary after a redaction is the expensive part technically, but skipping it makes the feature dishonest."),
            ],
        },
        {
            "title": "Why highlights went unused",
            "start": 1240,
            "lines": [
                (DANIEL["name"], "Changing subject. Your account has almost no highlights, which surprised us given how long your meetings are."),
                (NADIA["name"], "We tried them for about a month. The problem is they are private to the person who made them."),
                (NADIA["name"], "In a governance meeting the useful thing is for the room to agree that a moment matters. A private bookmark is a personal note, which I can already take on paper."),
                (SARAH["name"], "So a shared highlight that everyone on the meeting sees would be used?"),
                (NADIA["name"], "A shared highlight I could put in front of the clinical board would be used constantly. That is most of the value of the recording for us."),
                (CHRIS["name"], "Same with the clip links. We use those already, they are the one feature that spreads on its own."),
                (EMMA["name"], "That tracks. Your clip links get opened more than any other account on our books."),
            ],
        },
        {
            "title": "Close",
            "start": 1800,
            "lines": [
                (SARAH["name"], "Let me say back what I heard. Redaction with regenerated summaries and an audit trail is a blocker. Shared highlights are the biggest unlock. Clips already work."),
                (NADIA["name"], "That is accurate. And the redaction one is not a nice to have. It is the thing that decides whether we expand to the other two sites."),
                (EMMA["name"], "Understood, and I will not pretend it is a next-sprint item. Sarah, when could we realistically scope it?"),
                (SARAH["name"], "Scope in October, build in Q1. I would rather give you a date I will meet."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "Helio Health use the product for clinical governance rather than patient consultations. "
            "Twice a month they delete an entire meeting because a patient name was mentioned in "
            "passing and there is no way to redact a range. They also explained why highlights went "
            "unused: highlights are private, and their use case is a shared moment the room agrees on."
        ),
        "key_points": [
            "Helio delete roughly two full meetings a month because a single sentence cannot be redacted.",
            "Redaction must cover audio, transcript and a regenerated summary, plus an audit entry recording that it happened.",
            "Audio must be genuinely deleted, not merely made inaccessible, to satisfy their retention policy.",
            "Highlights went unused because they are private; the value for them is a shared moment the room agrees on.",
            "Clip links are their most-shared feature and are opened more than in any other account.",
        ],
        "decisions": [
            "Scope redaction in October and build in Q1 rather than promising a nearer date.",
            "Treat shared highlights as the primary unlock for this segment.",
        ],
        "topics": ["Redaction", "Compliance", "Highlights", "Clip Sharing", "Healthcare"],
        "insights": [
            "The unused-feature explanation was more valuable than the feature request. Highlights were not badly built, they were built single-player for a multiplayer job.",
            "Redaction is an expansion blocker, not a satisfaction issue. Nadia tied it directly to whether two more sites adopt.",
            "The one feature spreading on its own is the one that leaves the product entirely, which suggests sharing is under-invested relative to in-app features.",
        ],
    },
    "action_items": [
        {"task": "Scope range redaction with summary regeneration and audit trail", "assignee": "Sarah Chen", "due_date": "Oct 31", "status": "open", "timestamp": 1920},
        {"task": "Write the shared highlights proposal for Q1 planning", "assignee": "Daniel Kim", "due_date": "Oct 10", "status": "open", "timestamp": 1560},
        {"task": "Pull clip open rates across all accounts for comparison", "assignee": "Emma Davis", "due_date": "Sep 26", "status": "done", "timestamp": 1740},
        {"task": "Confirm hard-delete semantics for redacted audio with Hana", "assignee": "Emma Davis", "due_date": "Oct 03", "status": "open", "timestamp": 1080},
    ],
    "highlights": [
        {"title": "Two meetings a month deleted over one sentence", "quote": "throw away a governance record", "speaker": "Dr. Nadia Rahman", "category": "risk"},
        {"title": "Redaction must regenerate the summary to be honest", "quote": "makes the feature dishonest", "speaker": "Daniel Kim", "category": "insight"},
        {"title": "Highlights are private, the job is shared", "quote": "private to the person who made them", "speaker": "Dr. Nadia Rahman", "category": "key-moment"},
        {"title": "Redaction decides a two-site expansion", "quote": "expand to the other two sites", "speaker": "Dr. Nadia Rahman", "category": "risk"},
    ],
}
