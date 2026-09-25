from app.seed.base import ALEX, AYESHA, DANIEL, HANA, MUHAMMAD, RYAN, SARAH, VICTOR


ARCHITECTURE_REVIEW = {
    "title": "AI Platform Architecture Review",
    "description": "Eight people, sixty-two minutes. Chunking strategy, vector store build-vs-buy, and the cost ceiling.",
    "meeting_type": "Internal",
    "platform": "Zoom",
    "days_ago": 6,
    "hour": 13,
    "participants": [RYAN, MUHAMMAD, ALEX, AYESHA, VICTOR, HANA, SARAH, DANIEL],
    "blocks": [
        {
            "title": "Framing the decision",
            "start": 0,
            "lines": [
                (RYAN["name"], "Eight of us and an hour, so let me set the frame. We are deciding three things today: how we chunk transcripts, whether we build or buy the vector store, and what our cost ceiling per meeting is."),
                (RYAN["name"], "What we are not doing is redesigning the whole pipeline. If someone says the word rewrite I am going to push back hard."),
                (MUHAMMAD["name"], "Agreed. Ayesha, you have been living in this for two weeks. Start with what we know rather than what we want."),
                (AYESHA["name"], "What we know. The current pipeline sends the whole transcript in one call. Past roughly nine thousand tokens the provider API truncates and we do not detect it."),
                (AYESHA["name"], "I measured it across our corpus. Thirty-one percent of meetings over forty minutes have summaries missing content from the middle third of the call."),
                (SARAH["name"], "Thirty-one percent. Say that again, because that number changes how I talk to customers."),
                (AYESHA["name"], "Thirty-one percent of meetings over forty minutes. For meetings under forty minutes it is effectively zero."),
                (RYAN["name"], "That is the worst number anyone has shown me this quarter. Keep going."),
            ],
        },
        {
            "title": "Chunking strategy",
            "start": 620,
            "lines": [
                (AYESHA["name"], "Three options for chunking. Fixed token windows, speaker-turn boundaries, or semantic topic segmentation."),
                (ALEX["name"], "Fixed windows are trivial and they will cut people off mid sentence. I have seen what that does to summary quality, it is not subtle."),
                (AYESHA["name"], "It is not. I tried it first. Fixed windows produced summaries that invented transitions that never happened, because the model was stitching across a cut."),
                (VICTOR["name"], "Speaker-turn boundaries are cheap and they respect the natural structure. What is the argument against?"),
                (AYESHA["name"], "On an eight-person call like this one, turns are short and constant. You end up with four hundred tiny chunks and the merge step becomes the bottleneck."),
                (MUHAMMAD["name"], "So neither extreme works. What about turn boundaries with a minimum chunk size, accumulating turns until you hit a token floor?"),
                (AYESHA["name"], "That is roughly what I landed on. Accumulate whole turns up to about two thousand tokens, never split a turn, overlap by one turn for context."),
                (ALEX["name"], "The overlap matters more than people think. Without it the model loses the antecedent of every pronoun at a chunk boundary."),
                (RYAN["name"], "Is topic segmentation meaningfully better than that, or is it just more sophisticated?"),
                (AYESHA["name"], "Honestly? On our corpus it was about four percent better on my evaluation set and it needed an extra model call per meeting. Not worth it yet."),
                (RYAN["name"], "Then we are not doing it. Turn-accumulating chunks with overlap, decided. Next."),
            ],
        },
        {
            "title": "Build versus buy the vector store",
            "start": 1420,
            "lines": [
                (MUHAMMAD["name"], "Vector store. Victor has the strongest opinion so he should go first, and then I will argue the other side."),
                (VICTOR["name"], "We already run Postgres. pgvector exists, it is mature enough, and it means one database to back up, monitor, and reason about at three in the morning."),
                (VICTOR["name"], "Every managed vector service I have looked at is a second consistency domain. Now your embeddings and your rows can disagree and you have to build reconciliation."),
                (MUHAMMAD["name"], "The counter-argument is scale. At two hundred thousand segments pgvector with an IVFFlat index is fine. At twenty million I am less sure."),
                (VICTOR["name"], "How close are we to twenty million?"),
                (AYESHA["name"], "We are at about four hundred thousand segments today across all workspaces. Growing maybe fifteen percent a month."),
                (VICTOR["name"], "Then twenty million is roughly two and a half years out, assuming growth holds. I am not buying a second database for a problem in 2029."),
                (ALEX["name"], "That is fair but I want to name the risk. Migrating off pgvector later is not free, it is a quarter of work and a careful cutover."),
                (RYAN["name"], "It is, and I would rather pay that quarter in 2028 with revenue than pay a managed service bill now while we are burning."),
                (HANA["name"], "One security note. A managed vector service means transcript embeddings leaving our tenancy. For the EU customers that is a new sub-processor and a new DPA."),
                (HANA["name"], "Northwind specifically has region pinning in their contract. I would have to go back to them and get that amended."),
                (RYAN["name"], "That settles it for me. pgvector. Victor, you own it."),
                (VICTOR["name"], "Happily. I will have a spike with real embeddings on the Northwind corpus by the end of next week."),
            ],
        },
        {
            "title": "Cost ceiling",
            "start": 2360,
            "lines": [
                (RYAN["name"], "Cost. What does a sixty-minute meeting cost us to process today, and what will it cost after chunking?"),
                (AYESHA["name"], "Today, about eleven cents. Transcription is most of it. Summarisation is one call so it is cheap and, as established, wrong."),
                (AYESHA["name"], "After chunking, a sixty-minute meeting is roughly nine chunks plus a merge pass. Call it ten model calls instead of one."),
                (MUHAMMAD["name"], "Which takes us to what, thirty cents?"),
                (AYESHA["name"], "About twenty-eight cents at current API pricing, if we use the small model for chunk summaries and the larger one only for the merge."),
                (RYAN["name"], "And our lowest paid tier is nineteen dollars a month. What is the heaviest user doing?"),
                (SARAH["name"], "Our heaviest individual user recorded ninety-one meetings last month. Mostly thirty-minute calls."),
                (RYAN["name"], "Ninety-one times twenty-eight cents is about twenty-five dollars against a nineteen dollar plan. That is a negative margin user."),
                (ALEX["name"], "Only if every meeting is sixty minutes. At thirty minutes it is four chunks, not nine, so the real number is closer to twelve dollars."),
                (RYAN["name"], "Still thin. Ayesha, is the small model actually adequate for chunk summaries or is that wishful?"),
                (AYESHA["name"], "I tested it. For per-chunk extraction the small model is genuinely fine, the hard reasoning is all in the merge. That is where the quality lives."),
                (RYAN["name"], "Then the ceiling is thirty cents per meeting-hour and we revisit if the mix shifts. Not a hard cap, a tripwire. If we cross it I want to know why."),
            ],
        },
        {
            "title": "Latency and failure modes",
            "start": 3060,
            "lines": [
                (DANIEL["name"], "Question from the design side. How long until a summary appears after a call ends? Because that changes what I put on the screen."),
                (AYESHA["name"], "Today about forty seconds. With ten sequential calls it would be four minutes, which is unacceptable."),
                (VICTOR["name"], "So do not run them sequentially. Chunks are independent, fan them out, and only the merge has to wait."),
                (AYESHA["name"], "Right, parallel chunks plus merge is about ninety seconds. Still slower than today but not four minutes."),
                (DANIEL["name"], "Ninety seconds I can design for. I will show the transcript immediately and stream the summary in when it lands. The transcript is ready first anyway."),
                (ALEX["name"], "What happens if chunk six of nine fails?"),
                (AYESHA["name"], "Right now the whole summary fails. That is wrong. It should merge what it has and mark the summary partial."),
                (HANA["name"], "Please make partial visible in the interface rather than silent. A silently partial summary is the bug we are already in this room to fix."),
                (RYAN["name"], "Strong agree. Partial is fine, silently partial is not. That is the lesson of the whole meeting."),
            ],
        },
        {
            "title": "Close",
            "start": 3480,
            "lines": [
                (RYAN["name"], "Three decisions: turn-accumulating chunks with overlap, pgvector, thirty cents per meeting-hour as a tripwire."),
                (MUHAMMAD["name"], "I will write it up as an ADR today so we do not relitigate it in three weeks."),
                (RYAN["name"], "Good meeting. That thirty-one percent number was worth the hour on its own."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "A sixty-two minute architecture review with eight attendees that resolved three "
            "decisions: chunking strategy, vector store build-vs-buy, and a per-meeting cost "
            "ceiling. The meeting turned on Ayesha's measurement that 31% of meetings over forty "
            "minutes currently produce summaries missing content from the middle of the call."
        ),
        "key_points": [
            "31% of meetings over 40 minutes have summaries silently missing middle-of-call content. Under 40 minutes it is effectively zero.",
            "Fixed-width chunking made the model invent transitions that never happened; pure speaker-turn chunking produces ~400 chunks on an eight-person call.",
            "Semantic topic segmentation tested only 4% better than turn-accumulation, for an extra model call per meeting.",
            "The corpus is ~400k segments growing 15% monthly, putting pgvector's practical ceiling roughly two and a half years out.",
            "Processing cost moves from ~11 cents to ~28 cents per sixty-minute meeting, against a $19 entry plan.",
        ],
        "decisions": [
            "Chunk by accumulating whole speaker turns to ~2,000 tokens with one turn of overlap. Never split a turn.",
            "Use pgvector rather than a managed vector service, decided on operational simplicity and EU sub-processor risk.",
            "Set 30 cents per meeting-hour as a cost tripwire rather than a hard cap.",
            "Summaries that lose a chunk must merge what remains and show as partial, never fail silently.",
        ],
        "topics": ["Chunking", "pgvector", "Cost Control", "Latency", "Architecture"],
        "insights": [
            "Hana's sub-processor point, raised late and in one sentence, is what actually closed the build-vs-buy debate. The scaling argument had circled for ten minutes without resolving.",
            "Every option rejected here was rejected with a measurement attached. The 4% figure killed topic segmentation more efficiently than any architectural argument would have.",
            "The cost discussion nearly concluded on a worst-case number until Alex corrected the meeting-length assumption, which more than halved the estimate.",
            "The closing principle, partial is fine but silently partial is not, is a restatement of the original bug. Worth carrying into the design review.",
        ],
    },
    "action_items": [
        {"task": "Write the chunking and vector store decisions up as an ADR", "assignee": "Muhammad Umar", "due_date": "Sep 19", "status": "done", "timestamp": 3540},
        {"task": "Spike pgvector with real embeddings on the Northwind corpus", "assignee": "Victor Osei", "due_date": "Sep 27", "status": "open", "timestamp": 2280},
        {"task": "Implement parallel chunk fan-out with merge-on-partial", "assignee": "Ayesha Malik", "due_date": "Oct 04", "status": "open", "timestamp": 3300},
        {"task": "Design the partial-summary state in the meeting detail view", "assignee": "Daniel Kim", "due_date": "Sep 30", "status": "open", "timestamp": 3240},
        {"task": "Add per-meeting processing cost to the internal dashboard", "assignee": "Alex Johnson", "due_date": "Oct 08", "status": "open", "timestamp": 2900},
        {"task": "Confirm no new sub-processor is added for EU customers", "assignee": "Hana Sato", "due_date": "Sep 26", "status": "open", "timestamp": 2100},
    ],
    "highlights": [
        {"title": "31% of long meetings have incomplete summaries", "quote": "I measured it across our corpus", "speaker": "Ayesha Malik", "category": "risk"},
        {"title": "Fixed chunking made the model invent transitions", "quote": "invented transitions that never happened", "speaker": "Ayesha Malik", "category": "insight"},
        {"title": "EU sub-processor risk settles build-vs-buy", "quote": "a new sub-processor", "speaker": "Hana Sato", "category": "decision"},
        {"title": "A negative-margin user at 91 meetings a month", "quote": "negative margin user", "speaker": "Ryan Cooper", "category": "risk"},
        {"title": "Partial is fine, silently partial is not", "quote": "Partial is fine, silently partial is not", "speaker": "Ryan Cooper", "category": "key-moment"},
    ],
}
