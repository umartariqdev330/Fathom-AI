from app.seed.base import SARAH, MUHAMMAD, TOM, PRIYA, JAMES


CLIENT_DISCOVERY = {
    "title": "Client Discovery Call - Northwind Logistics",
    "description": "Discovery with Northwind ahead of the renewal. Compliance and search came up hard.",
    "meeting_type": "External",
    "platform": "Microsoft Teams",
    "days_ago": 4,
    "hour": 14,
    "participants": [TOM, SARAH, MUHAMMAD, PRIYA, JAMES],
    "blocks": [
        {
            "title": "Context",
            "start": 0,
            "lines": [
                (TOM["name"], "Thanks for making the time, Priya, James. I have Sarah from product and Muhammad who leads engineering, so anything technical we can answer in the room."),
                (PRIYA["name"], "Good, because James has questions I cannot answer and I have questions your account team could not."),
                (TOM["name"], "That is the idea. Priya, where are you actually feeling pain right now?"),
                (PRIYA["name"], "Volume. We have forty-one people on Meetly now, up from twelve when we signed. My ops managers are each in fifteen to twenty calls a week."),
                (PRIYA["name"], "The notes are good. Finding anything across them is impossible. Last Tuesday I needed every conversation where a carrier mentioned the Rotterdam delay and I genuinely could not get it."),
                (SARAH["name"], "What did you do instead?"),
                (PRIYA["name"], "I asked four people to go through their own meetings manually. It took two days and I am still not confident we found everything."),
            ],
        },
        {
            "title": "Search requirements",
            "start": 560,
            "lines": [
                (MUHAMMAD["name"], "When you say find every conversation, would matching the literal phrase Rotterdam delay have worked, or do you need it to understand related wording?"),
                (PRIYA["name"], "Related wording. Half my carriers say Rotterdam, the other half say the Netherlands backlog or the port situation. Same problem, three names."),
                (MUHAMMAD["name"], "That is semantic search rather than keyword. I want to be straight with you: keyword lands this quarter, semantic is a Q1 piece of work."),
                (PRIYA["name"], "I would rather hear that than be told yes and find out in March."),
                (SARAH["name"], "Would keyword across all meetings be useful to you in the meantime, or is it only semantic that solves it?"),
                (PRIYA["name"], "Keyword helps. It is maybe sixty percent of the value. It would have found the Rotterdam ones at least."),
            ],
        },
        {
            "title": "Compliance",
            "start": 1120,
            "lines": [
                (JAMES["name"], "My questions are less exciting. Where does the audio live, who can read it, and what happens when someone leaves the company."),
                (MUHAMMAD["name"], "Recordings sit in encrypted object storage, region-pinned. You are on our EU tenant so nothing crosses out of Frankfurt. Access is per workspace with role checks on every read."),
                (JAMES["name"], "Offboarding. If an ops manager leaves on Friday, what happens to the forty meetings they recorded?"),
                (MUHAMMAD["name"], "Today they transfer to the workspace owner when you deactivate the user. What we do not have is a bulk export for a departing employee, which I suspect is what you actually want."),
                (JAMES["name"], "It is. Our retention policy says I have to be able to produce everything associated with a person within ten working days."),
                (SARAH["name"], "That is a concrete gap and a fair one. Muhammad, is per-user export hard?"),
                (MUHAMMAD["name"], "Not hard. It is a day of work plus a job queue so it does not time out on a large account. I would want it behind an admin role."),
                (JAMES["name"], "If that exists by renewal my security review gets a lot shorter."),
            ],
        },
        {
            "title": "Next steps",
            "start": 1760,
            "lines": [
                (TOM["name"], "Let me summarise what I owe you. Keyword search this quarter, semantic in Q1 with no promises on the week, and per-user export scoped before renewal."),
                (PRIYA["name"], "And I want to see keyword search working, not described. Can you demo it Thursday?"),
                (TOM["name"], "Thursday works. Muhammad, is that fair?"),
                (MUHAMMAD["name"], "Fair. It will be rough around the edges and I would rather show you something honest than a mock."),
                (PRIYA["name"], "Honest is what gets you renewed. Thursday then."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "Northwind has grown from 12 to 41 seats and has hit a hard wall on finding anything "
            "across meetings. Priya described spending two days having four people manually review "
            "their own calls. James raised a concrete compliance gap: there is no per-user export "
            "for a departing employee, which their ten-day retention obligation requires."
        ),
        "key_points": [
            "Northwind grew from 12 to 41 seats; each ops manager attends 15-20 calls a week.",
            "Their search need is semantic, not keyword: carriers describe the same issue three different ways.",
            "Keyword search alone is worth roughly 60% of the value to them, by Priya's own estimate.",
            "No bulk per-user export exists today, and their retention policy requires it within ten working days.",
        ],
        "decisions": [
            "Commit keyword search this quarter and semantic search in Q1 with no week-level promise.",
            "Scope per-user export behind an admin role before the renewal date.",
            "Demo working keyword search on Thursday rather than a mock.",
        ],
        "topics": ["Renewal", "Search", "Compliance", "Data Export", "EU Tenancy"],
        "insights": [
            "Priya twice rewarded a direct no. The commitment that landed best in this call was the one that came with a caveat attached.",
            "The compliance gap is the higher renewal risk of the two. Search is a satisfaction problem; export is a policy blocker that James cannot sign around.",
            "Northwind is describing a workflow that spans people, not just meetings. That is a different product shape than per-user notes.",
        ],
    },
    "action_items": [
        {"task": "Demo working keyword search to Northwind on Thursday", "assignee": "Tom Wilson", "due_date": "Sep 25", "status": "open", "timestamp": 1800},
        {"task": "Scope per-user meeting export behind an admin role", "assignee": "Muhammad Umar", "due_date": "Oct 03", "status": "open", "timestamp": 1560},
        {"task": "Confirm EU tenant region pinning in writing for James", "assignee": "Tom Wilson", "due_date": "Sep 26", "status": "open", "timestamp": 1240},
        {"task": "Add Northwind semantic search need to Q1 planning input", "assignee": "Sarah Chen", "due_date": "Oct 01", "status": "done", "timestamp": 880},
    ],
    "highlights": [
        {"title": "Two days of manual review to answer one question", "quote": "It took two days", "speaker": "Priya Nair", "category": "risk"},
        {"title": "Same problem, three different names", "quote": "Same problem, three names", "speaker": "Priya Nair", "category": "insight"},
        {"title": "Per-user export is a retention policy blocker", "quote": "ten working days", "speaker": "James Okafor", "category": "risk"},
        {"title": "Honest is what gets you renewed", "quote": "Honest is what gets you renewed", "speaker": "Priya Nair", "category": "key-moment"},
    ],
}
