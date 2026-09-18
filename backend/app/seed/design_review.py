from app.seed.base import ALEX, AYESHA, DANIEL, EMMA, MUHAMMAD, SARAH


DESIGN_REVIEW = {
    "title": "Design Review - Meeting Workspace",
    "description": "The detail page redesign. Transcript placement, summary citations, and what the timeline shows.",
    "meeting_type": "Internal",
    "platform": "Google Meet",
    "days_ago": 10,
    "hour": 15,
    "participants": [DANIEL, SARAH, MUHAMMAD, ALEX, EMMA, AYESHA],
    "blocks": [
        {
            "title": "The problem being solved",
            "start": 0,
            "lines": [
                (DANIEL["name"], "Before the screens, the problem. Eleven percent of sessions reach the transcript. Everyone reads the summary and leaves."),
                (DANIEL["name"], "My read is that the transcript looks like a wall of text with no way in, so people do not start."),
                (EMMA["name"], "That matches what I hear. Customers say they trust the summary until it gets something wrong, and then they have no way to check it without watching the whole recording."),
                (SARAH["name"], "So the job is not to make the transcript prettier. It is to make the summary verifiable."),
                (DANIEL["name"], "Exactly the reframe I landed on, and it changed the design completely."),
            ],
        },
        {
            "title": "Summary citations",
            "start": 400,
            "lines": [
                (DANIEL["name"], "Every summary line carries the timestamp it came from. Click it and the player seeks, the transcript scrolls, and the source segment highlights."),
                (MUHAMMAD["name"], "That is only possible because of the citation work in the chunking epic. Ayesha, is the mapping reliable enough to hang an interaction on?"),
                (AYESHA["name"], "For key points and decisions, yes, because those come from a specific chunk and I keep the segment ids. The overview is synthesised across chunks so it has no single source."),
                (DANIEL["name"], "Then the overview gets no citation and everything else does. That is a cleaner rule than citing everything badly."),
                (ALEX["name"], "What happens on an old meeting summarised before citations existed?"),
                (AYESHA["name"], "No segment ids, so no citations. It should degrade to plain text rather than showing dead links."),
                (DANIEL["name"], "I will design both states. A cited line and an uncited line should not look broken next to each other."),
            ],
        },
        {
            "title": "Layout and the timeline",
            "start": 1080,
            "lines": [
                (DANIEL["name"], "Layout. Player and summary side by side above the fold, transcript in the right rail, always visible, never below the fold."),
                (SARAH["name"], "On a laptop that is three columns. Does it survive at thirteen inches?"),
                (DANIEL["name"], "Barely, and it does not survive on tablet. Below about eleven hundred pixels the transcript becomes a tab next to the summary rather than a rail."),
                (EMMA["name"], "Most of my customer calls are on a laptop in a hotel or on a phone. The phone case matters more than we assume."),
                (DANIEL["name"], "On phone it is a single column: player, then tabs for summary, transcript, action items, highlights."),
                (MUHAMMAD["name"], "What is on the timeline itself?"),
                (DANIEL["name"], "Highlights as markers. Nothing else. I tried chapters and speaker density and both made it unreadable."),
                (ALEX["name"], "Density was genuinely useful on the eight-person call though. You could see who dominated."),
                (DANIEL["name"], "It was useful and it was also noise on a two-person call. If we do it, it belongs in an analytics view, not on the scrubber."),
                (SARAH["name"], "Agreed. Not this quarter."),
            ],
        },
        {
            "title": "Close",
            "start": 1880,
            "lines": [
                (SARAH["name"], "Are we confident this moves the eleven percent?"),
                (DANIEL["name"], "Confident it moves. Not confident how far. I would instrument transcript reach and time on page and check in four weeks after release."),
                (SARAH["name"], "Do that. If it does not move we learned the problem is not the layout."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "The detail page redesign was reframed mid-meeting from making the transcript more "
            "attractive to making the summary verifiable. The resulting design cites every summary "
            "key point and decision back to a transcript timestamp, and keeps the transcript "
            "permanently visible rather than below the fold."
        ),
        "key_points": [
            "Customers trust the summary until it is wrong, and then have no way to check it short of rewatching.",
            "Only key points and decisions can carry citations; the overview is synthesised across chunks and has no single source.",
            "The three-column layout collapses to tabs below ~1100px and to a single column on phones.",
            "Speaker density on the timeline was useful on the eight-person call and noise on two-person calls.",
        ],
        "decisions": [
            "Summary key points and decisions cite a timestamp; the overview does not.",
            "Pre-citation meetings degrade to plain text rather than showing dead links.",
            "The timeline shows highlight markers only. Speaker density is deferred to an analytics view.",
            "Instrument transcript reach and time on page, and review four weeks after release.",
        ],
        "topics": ["Detail Page", "Citations", "Responsive Layout", "Timeline"],
        "insights": [
            "The strongest move in this meeting was a reframe, not a design. Once the goal became verifiability rather than readability the layout questions mostly answered themselves.",
            "Daniel twice chose the narrower rule over the more complete one: no citation beats a bad citation, highlights only beats a busy timeline.",
            "Emma's point about phones came from customer context nobody else in the room had. The mobile case was being under-weighted until she raised it.",
        ],
    },
    "action_items": [
        {"task": "Design cited and uncited summary line states", "assignee": "Daniel Kim", "due_date": "Oct 02", "status": "open", "timestamp": 900},
        {"task": "Keep segment ids on key points and decisions in the summary payload", "assignee": "Ayesha Malik", "due_date": "Oct 04", "status": "open", "timestamp": 640},
        {"task": "Instrument transcript reach and time on page", "assignee": "Alex Johnson", "due_date": "Oct 10", "status": "open", "timestamp": 1940},
        {"task": "Review the mobile single-column layout with Emma's customer cases", "assignee": "Daniel Kim", "due_date": "Oct 06", "status": "open", "timestamp": 1500},
    ],
    "highlights": [
        {"title": "The job is to make the summary verifiable", "quote": "make the summary verifiable", "speaker": "Sarah Chen", "category": "key-moment"},
        {"title": "No citation beats a bad citation", "quote": "citing everything badly", "speaker": "Daniel Kim", "category": "decision"},
        {"title": "Timeline shows highlights only", "quote": "Highlights as markers", "speaker": "Daniel Kim", "category": "decision"},
    ],
}
