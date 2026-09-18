from app.seed.base import SARAH, MUHAMMAD, DANIEL, AYESHA, TOM, RYAN


PRODUCT_STRATEGY = {
    "title": "Product Strategy Sync",
    "description": "Q4 roadmap sequencing and what we cut to protect the AI pipeline work.",
    "meeting_type": "Internal",
    "platform": "Google Meet",
    "days_ago": 1,
    "hour": 10,
    "participants": [SARAH, MUHAMMAD, DANIEL, RYAN, AYESHA, TOM],
    "blocks": [
        {
            "title": "Opening",
            "start": 0,
            "lines": [
                (SARAH["name"], "Morning everyone. One hour, and I want to leave with a sequenced Q4 roadmap, not a wish list. Ryan has to take this to the board on the 14th."),
                (RYAN["name"], "To be blunt about the constraint: we have eleven engineers and the board deck says we ship three things. Not seven. Three."),
                (SARAH["name"], "Right. So the question for this hour is which three, and what we are explicitly not doing."),
                (DANIEL["name"], "Can we agree on how we are judging them first? Otherwise we will argue in circles about pet features."),
                (SARAH["name"], "Fair. Two criteria. Does it reduce churn in the mid-market segment, and can it ship before the November deadline."),
            ],
        },
        {
            "title": "AI pipeline",
            "start": 320,
            "lines": [
                (MUHAMMAD["name"], "Then the AI meeting pipeline has to be first. Every churn interview Emma ran last quarter mentioned summary quality, and right now our summaries degrade badly past about forty minutes."),
                (AYESHA["name"], "It is worse than degrade. Past roughly nine thousand tokens we silently truncate the middle of the transcript. The summary looks fine and it is quietly missing the back half of the meeting."),
                (RYAN["name"], "That is a correctness bug, not a roadmap item. How long to fix properly?"),
                (AYESHA["name"], "Chunked map-reduce summarisation with a merge pass. Two weeks for a version I trust, three if we want per-chunk citations back to timestamps."),
                (SARAH["name"], "Take the three. The citations are the thing customers actually ask for. They do not trust a summary they cannot verify."),
                (MUHAMMAD["name"], "Agreed, and the citation work is what makes the summary panel clickable, which Daniel needs for the new detail layout anyway."),
                (DANIEL["name"], "It changes the design meaningfully. If every summary line can jump to a timestamp the panel becomes navigation, not just text."),
            ],
        },
        {
            "title": "Second priority",
            "start": 900,
            "lines": [
                (SARAH["name"], "Second slot. Tom, you have been loud about search. Make the case."),
                (TOM["name"], "Three deals stalled on it last month. Sandwell, Orbit, and the Northwind renewal. All three asked the same question: can I search across every call my team has ever recorded."),
                (TOM["name"], "Right now I have to say no, you can search inside one meeting. On a sales call that answer is the end of the conversation."),
                (MUHAMMAD["name"], "Cross-meeting search is not hard technically. Postgres full text gets us most of the way. The hard part is ranking, because raw keyword matching across two hundred meetings returns noise."),
                (RYAN["name"], "Ship keyword first, ranking second. A noisy answer beats no answer on a sales call."),
                (SARAH["name"], "That is the right call. Tom, would keyword search have saved those three deals?"),
                (TOM["name"], "Sandwell and Orbit yes. Northwind wanted semantic search specifically, they asked about finding concepts rather than words."),
                (AYESHA["name"], "Semantic means embeddings and a vector index. That is a quarter of work on its own, not a slot in this one."),
                (SARAH["name"], "Then it is not in Q4. Tom, you can tell Northwind it is on the roadmap for Q1 and mean it."),
            ],
        },
        {
            "title": "Third slot and cuts",
            "start": 1740,
            "lines": [
                (DANIEL["name"], "Third slot, I want the meeting detail redesign. The current page buries the transcript below the fold and nobody finds the highlights."),
                (RYAN["name"], "Is that a real problem or a taste problem? I need to be careful here, redesigns eat quarters."),
                (DANIEL["name"], "Real. We instrumented it. Eleven percent of sessions ever scroll to the transcript. On the calls where people do scroll, session length triples."),
                (RYAN["name"], "Eleven percent. Fine, that is a real number, I withdraw the objection."),
                (SARAH["name"], "So: AI pipeline, cross-meeting search, detail page redesign. What falls off?"),
                (MUHAMMAD["name"], "The Salesforce integration, the mobile app, and the custom summary templates."),
                (TOM["name"], "The Salesforce one hurts. That is a real objection in enterprise deals."),
                (SARAH["name"], "It is, and it is still not a Q4 item. Tom, I would rather you sell three finished things than six half-built ones."),
                (RYAN["name"], "Agreed. I will frame it that way for the board on the 14th."),
            ],
        },
        {
            "title": "Close",
            "start": 2280,
            "lines": [
                (SARAH["name"], "Muhammad, can you write the one-page sequencing doc by Thursday so Ryan has it before the board prep?"),
                (MUHAMMAD["name"], "Yes. I will include the engineering estimates so the dates are defensible rather than aspirational."),
                (DANIEL["name"], "I will have the detail page prototype ready for design review on the 12th."),
                (SARAH["name"], "Good. That is the roadmap. Three things, everything else is a no for this quarter."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "The team narrowed a seven-item Q4 wish list down to three committed deliverables, "
            "using two criteria: reduces mid-market churn, and ships before the end of November. "
            "The AI summarisation pipeline took the first slot after Ayesha disclosed a silent "
            "truncation bug that drops the middle of any transcript past roughly nine thousand tokens."
        ),
        "key_points": [
            "Long transcripts are silently truncated past ~9k tokens, so summaries of long meetings are quietly incomplete.",
            "Chunked map-reduce summarisation with timestamp citations was estimated at three weeks.",
            "Three deals stalled on the absence of cross-meeting search: Sandwell, Orbit and the Northwind renewal.",
            "Only 11% of sessions ever scroll to the transcript, but those that do run three times longer.",
        ],
        "decisions": [
            "Q4 ships exactly three things: AI pipeline rework, cross-meeting keyword search, and the meeting detail redesign.",
            "Semantic search is explicitly deferred to Q1 rather than squeezed into Q4.",
            "Salesforce integration, the mobile app and custom summary templates are cut from Q4.",
        ],
        "topics": ["Q4 Roadmap", "AI Pipeline", "Search", "Prioritisation", "Board Prep"],
        "insights": [
            "The truncation bug was raised as a roadmap item but is really a correctness defect. Ryan reframing it that way is what moved it to first position.",
            "Every prioritisation argument that succeeded in this call was backed by a number. The two that failed were not.",
            "Tom accepted the Salesforce cut without pushback once the tradeoff was framed as three finished features versus six unfinished ones.",
        ],
    },
    "action_items": [
        {"task": "Write the one-page Q4 sequencing doc with engineering estimates", "assignee": "Muhammad Umar", "due_date": "Sep 25", "status": "open", "timestamp": 2280},
        {"task": "Prepare meeting detail page prototype for design review", "assignee": "Daniel Kim", "due_date": "Oct 12", "status": "open", "timestamp": 2350},
        {"task": "Tell Northwind semantic search lands in Q1, not Q4", "assignee": "Tom Wilson", "due_date": "Sep 22", "status": "done", "timestamp": 1680},
        {"task": "Scope chunked summarisation with timestamp citations", "assignee": "Ayesha Malik", "due_date": "Sep 26", "status": "open", "timestamp": 520},
        {"task": "Frame the three-feature commitment for the board deck", "assignee": "Ryan Cooper", "due_date": "Oct 14", "status": "open", "timestamp": 2210},
    ],
    "highlights": [
        {"title": "Summaries silently drop the middle of long meetings", "quote": "silently truncate the middle", "speaker": "Ayesha Malik", "category": "risk"},
        {"title": "Three deals stalled on cross-meeting search", "quote": "Three deals stalled", "speaker": "Tom Wilson", "category": "key-moment"},
        {"title": "Only 11% of sessions reach the transcript", "quote": "Eleven percent of sessions", "speaker": "Daniel Kim", "category": "insight"},
        {"title": "Q4 commitment: three features, everything else is a no", "quote": "everything else is a no", "speaker": "Sarah Chen", "category": "decision"},
    ],
}
