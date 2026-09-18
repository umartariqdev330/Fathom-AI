from app.seed.base import ALEX, AYESHA, DANIEL, MUHAMMAD, SARAH, VICTOR, HANA


SPRINT_PLANNING = {
    "title": "Sprint Planning - Sprint 34",
    "description": "Two weeks, and the chunking work is bigger than the board says it is.",
    "meeting_type": "Internal",
    "platform": "Google Meet",
    "days_ago": 8,
    "hour": 11,
    "participants": [MUHAMMAD, ALEX, AYESHA, VICTOR, HANA, DANIEL, SARAH],
    "blocks": [
        {
            "title": "Capacity",
            "start": 0,
            "lines": [
                (MUHAMMAD["name"], "Sprint 34, two weeks. Before we pull anything in, let us be honest about capacity. Hana is at fifty percent because of the SOC 2 evidence collection."),
                (HANA["name"], "Closer to forty. The auditor deadline is the eighth and everything they asked for lands on me."),
                (MUHAMMAD["name"], "Forty then. Victor is fully on the pgvector spike, which is the architecture review follow-up, so he is not available for feature work."),
                (VICTOR["name"], "I would rather that be explicit on the board than discovered in week two."),
                (MUHAMMAD["name"], "It is. So realistically we have Alex, Ayesha and me at full capacity plus Daniel on design. That is the sprint."),
            ],
        },
        {
            "title": "The chunking epic",
            "start": 420,
            "lines": [
                (AYESHA["name"], "The chunking epic is sitting at eight points and I want to argue it is thirteen."),
                (MUHAMMAD["name"], "Argue it."),
                (AYESHA["name"], "The eight assumed sequential chunk calls. After the architecture review we committed to parallel fan-out with partial merge. That is a job queue, retry semantics, and a partial state the frontend has to render."),
                (ALEX["name"], "The retry semantics alone are not small. If chunk six fails twice do we retry a third time, or do we cut our losses and merge eight of nine?"),
                (AYESHA["name"], "Two retries then merge partial, is my instinct. Waiting forever for a perfect summary is worse than a good one that arrives."),
                (MUHAMMAD["name"], "Agreed, and that is exactly the kind of detail that was not in the eight-point estimate. Thirteen it is."),
                (SARAH["name"], "If it is thirteen, what comes out of the sprint?"),
                (MUHAMMAD["name"], "The search result pagination, or the transcript export. One of the two."),
                (SARAH["name"], "Keep pagination. Tom demos search to Northwind and a hanging page in front of a renewal customer is not a risk I want."),
                (ALEX["name"], "Then export slips. That is fine, nobody has asked for it this month."),
            ],
        },
        {
            "title": "Design work",
            "start": 1500,
            "lines": [
                (DANIEL["name"], "I need a decision on the partial summary state or I will guess and we will both be unhappy."),
                (DANIEL["name"], "My proposal: show the summary with a small inline marker saying which part of the call is missing, and a retry control. Not a banner, not a modal."),
                (AYESHA["name"], "Can you say which part specifically? I can give you the time range of the failed chunk."),
                (DANIEL["name"], "If you give me the range that is much better. Summary incomplete between 24 and 31 minutes is honest and actionable. A generic warning is neither."),
                (MUHAMMAD["name"], "Do that. Ayesha, include the failed range in the summary payload."),
                (HANA["name"], "One thing from me, and it is small. If a chunk fails because of a provider error we should not show the provider name in the interface."),
                (MUHAMMAD["name"], "Noted. Generic message in the interface, provider detail in the logs."),
            ],
        },
        {
            "title": "Commit",
            "start": 2280,
            "lines": [
                (MUHAMMAD["name"], "Committing: chunking epic at thirteen, search pagination at three, partial summary design at two, plus the usual support and deployment rotation."),
                (MUHAMMAD["name"], "Not committing: transcript export, the Slack integration spike, and the onboarding tour."),
                (SARAH["name"], "That is a smaller sprint than the last two."),
                (MUHAMMAD["name"], "It is, and the last two both spilled. I would rather commit less and finish it."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "Sprint 34 was deliberately sized smaller than the previous two, which both spilled. "
            "The chunking epic was re-estimated from eight points to thirteen once the parallel "
            "fan-out and partial-merge commitments from the architecture review were accounted for, "
            "which pushed transcript export out of the sprint."
        ),
        "key_points": [
            "Real capacity is three full engineers plus design; Hana is at 40% on SOC 2 and Victor is fully on the pgvector spike.",
            "The chunking epic was under-estimated because the original points assumed sequential calls, not parallel fan-out with partial merge.",
            "Retry policy settled at two retries per chunk, then merge what is available.",
            "Partial summaries will name the missing time range rather than show a generic warning.",
        ],
        "decisions": [
            "Chunking epic re-pointed from 8 to 13.",
            "Search pagination stays in the sprint; transcript export slips.",
            "Partial summary shows an inline marker with the failed time range and a retry control, not a banner.",
            "Provider names stay out of user-facing error messages and go to logs instead.",
        ],
        "topics": ["Sprint 34", "Capacity", "Chunking", "Estimation"],
        "insights": [
            "The re-estimate came from decisions made in the architecture review that never made it back onto the board. That gap between decision and backlog is worth watching.",
            "Daniel asked for a decision rather than guessing, and got a materially better design because the failed time range was available for the asking.",
        ],
    },
    "action_items": [
        {"task": "Include the failed chunk time range in the summary payload", "assignee": "Ayesha Malik", "due_date": "Sep 29", "status": "open", "timestamp": 1740},
        {"task": "Ship search result pagination before the Northwind demo", "assignee": "Alex Johnson", "due_date": "Sep 25", "status": "done", "timestamp": 1260},
        {"task": "Design the inline partial-summary marker with retry", "assignee": "Daniel Kim", "due_date": "Sep 30", "status": "open", "timestamp": 1620},
        {"task": "Move transcript export to the Sprint 35 candidate list", "assignee": "Muhammad Umar", "due_date": "Sep 23", "status": "done", "timestamp": 1380},
    ],
    "highlights": [
        {"title": "Chunking epic re-pointed from 8 to 13", "quote": "I want to argue it is thirteen", "speaker": "Ayesha Malik", "category": "decision"},
        {"title": "A good summary that arrives beats a perfect one that does not", "quote": "Waiting forever for a perfect summary", "speaker": "Ayesha Malik", "category": "insight"},
        {"title": "Name the missing range, not a generic warning", "quote": "honest and actionable", "speaker": "Daniel Kim", "category": "key-moment"},
    ],
}
