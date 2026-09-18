from app.seed.base import LENA, MARCUS, MUHAMMAD, RYAN, SARAH


INVESTOR_UPDATE = {
    "title": "Investor Update - Q3",
    "description": "Aldergate quarterly. Growth held, gross margin is the uncomfortable part.",
    "meeting_type": "External",
    "platform": "Zoom",
    "days_ago": 13,
    "hour": 16,
    "participants": [RYAN, SARAH, MUHAMMAD, LENA, MARCUS],
    "blocks": [
        {
            "title": "Numbers",
            "start": 0,
            "lines": [
                (RYAN["name"], "Thanks for the time. I will do ten minutes on numbers, then Sarah on product, then leave the rest for questions because that is usually the useful part."),
                (RYAN["name"], "Q3: ARR moved from one point eight to two point four million. Net revenue retention one hundred and twelve percent. Logo churn two point one percent, which is up slightly."),
                (LENA["name"], "Up from what?"),
                (RYAN["name"], "One point six. The increase is concentrated in accounts under ten seats, and it is almost entirely the second month after signup."),
                (MARCUS["name"], "So they sign up, use it for a month, and leave. What happens in month two?"),
                (SARAH["name"], "They hit the point where they have enough meetings that they need to find things across them, and we cannot do that yet. That is the churn mechanism, we are fairly confident."),
                (LENA["name"], "That is a good answer. It is falsifiable, which most churn explanations are not."),
            ],
        },
        {
            "title": "Margin",
            "start": 620,
            "lines": [
                (MARCUS["name"], "Gross margin. Last quarter you were at seventy-one percent and the plan said seventy-eight by year end."),
                (RYAN["name"], "We are at sixty-eight. It went the wrong way and I want to be direct about why rather than let you find it in the appendix."),
                (RYAN["name"], "We are about to triple our per-meeting inference cost to fix a summary quality problem. Eleven cents to twenty-eight on a sixty-minute call."),
                (MARCUS["name"], "That is a significant unit economics change. Is it optional?"),
                (MUHAMMAD["name"], "Not really. Thirty-one percent of meetings over forty minutes currently produce a summary that is silently missing the middle of the call. That is the product not working."),
                (LENA["name"], "I would rather you spend the margin than ship a summary product that quietly loses content. But I want to see it come back."),
                (RYAN["name"], "It comes back two ways. The small model handles per-chunk work at a fraction of the cost, and inference pricing has fallen every quarter for two years."),
                (MARCUS["name"], "Do not plan on the second one. Plan on the first."),
                (RYAN["name"], "Fair. The plan assumes flat pricing and gets us to seventy-four by Q2, not seventy-eight by year end. I will send the revised model."),
            ],
        },
        {
            "title": "Product and close",
            "start": 1400,
            "lines": [
                (SARAH["name"], "Product briefly. Q4 is three things: the summarisation fix, cross-meeting search, and the meeting detail redesign. Everything else is cut."),
                (LENA["name"], "Search being second rather than first is interesting, given you just told me it is the churn mechanism."),
                (SARAH["name"], "The summarisation problem is a correctness bug. I am not comfortable building retention features on top of a product that loses content."),
                (LENA["name"], "No, that is right. I would have done the same. Sequence matters and you have the sequence right."),
                (MARCUS["name"], "Last thing from me. What would make you raise earlier than planned?"),
                (RYAN["name"], "If enterprise deals start closing on the compliance work we are doing for Northwind, that is a different growth curve and I would want capital behind it."),
                (MARCUS["name"], "Then keep us close to that one specifically."),
            ],
        },
    ],
    "summary": {
        "overview": (
            "Quarterly update with Aldergate. ARR grew from $1.8M to $2.4M with 112% net revenue "
            "retention, but logo churn rose to 2.1% and gross margin fell to 68% against a 78% plan. "
            "Ryan disclosed the margin miss directly, tying it to a deliberate tripling of per-meeting "
            "inference cost to fix a summary correctness bug."
        ),
        "key_points": [
            "ARR $1.8M to $2.4M; NRR 112%; logo churn up from 1.6% to 2.1%.",
            "Churn is concentrated in sub-ten-seat accounts in their second month, when cross-meeting search becomes necessary.",
            "Gross margin is 68% against a 78% plan, driven by per-meeting inference cost going from 11 to 28 cents.",
            "Revised margin plan targets 74% by Q2 assuming flat inference pricing.",
        ],
        "decisions": [
            "Absorb the margin hit rather than ship summaries that silently lose content.",
            "Revised financial model assumes flat inference pricing rather than continued price declines.",
            "Keep Aldergate closely updated on the Northwind compliance work as a potential raise trigger.",
        ],
        "topics": ["ARR", "Churn", "Gross Margin", "Unit Economics", "Q4 Roadmap"],
        "insights": [
            "Lena rewarded the falsifiable churn explanation explicitly. Disclosing the margin miss before being asked bought credibility for the rest of the call.",
            "Marcus rejected the argument that falling inference prices will recover margin. The plan should not depend on it.",
            "Both partners independently endorsed fixing correctness before building retention features, which is a useful signal for internal sequencing arguments.",
        ],
    },
    "action_items": [
        {"task": "Send Aldergate the revised margin model on flat inference pricing", "assignee": "Ryan Cooper", "due_date": "Sep 22", "status": "done", "timestamp": 1320},
        {"task": "Break out second-month churn by account size for the next update", "assignee": "Sarah Chen", "due_date": "Oct 15", "status": "open", "timestamp": 560},
        {"task": "Keep Aldergate briefed on Northwind compliance progress", "assignee": "Ryan Cooper", "due_date": "Oct 20", "status": "open", "timestamp": 1800},
    ],
    "highlights": [
        {"title": "Churn mechanism: month two, no cross-meeting search", "quote": "That is the churn mechanism", "speaker": "Sarah Chen", "category": "insight"},
        {"title": "Margin fell to 68% and why", "quote": "It went the wrong way", "speaker": "Ryan Cooper", "category": "risk"},
        {"title": "Do not plan on inference prices falling", "quote": "Do not plan on the second one", "speaker": "Marcus Hale", "category": "key-moment"},
        {"title": "Correctness before retention features", "quote": "building retention features", "speaker": "Sarah Chen", "category": "decision"},
    ],
}
