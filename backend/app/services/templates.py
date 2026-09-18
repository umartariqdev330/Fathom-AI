"""Summary templates.

Fathom lets you re-read a meeting through a different lens. A sales lead wants
customer needs and commitments; an engineer wants decisions and blockers. Each
template below declares the sections it produces and the cues used to pull the
relevant lines out of the transcript.

`general` is the one meeting summaries are seeded with, so it reads back the
stored summary. Every other template is generated from the transcript on
request, by the LLM when a key is configured and by cue matching when not.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Section:
    label: str
    cues: tuple[str, ...]


@dataclass(frozen=True)
class Template:
    id: str
    label: str
    description: str
    sections: tuple[Section, ...]


TEMPLATES: dict[str, Template] = {
    "general": Template(
        id="general",
        label="General meeting",
        description="Balanced summary of what was covered and settled.",
        sections=(),  # served from the stored summary
    ),
    "sales": Template(
        id="sales",
        label="Sales call",
        description="What the customer needs, what they pushed back on, what we promised.",
        sections=(
            Section("Customer needs", ("we need", "we want", "my team", "our", "pain", "problem is", "cannot", "impossible")),
            Section("Objections and risks", ("concern", "risk", "worried", "blocker", "policy", "compliance", "security", "not good enough")),
            Section("Commitments made", ("we will", "i will", "commit", "this quarter", "by renewal", "promise", "roadmap")),
            Section("Next steps", ("next step", "follow up", "thursday", "demo", "send", "scope", "let me")),
        ),
    ),
    "engineering": Template(
        id="engineering",
        label="Engineering review",
        description="Technical decisions, trade-offs and what is blocking delivery.",
        sections=(
            Section("Technical decisions", ("decided", "we are going", "settles it", "chunk", "index", "database", "migrate", "architecture")),
            Section("Trade-offs discussed", ("versus", "instead", "option", "cheaper", "faster", "cost", "scale", "better than")),
            Section("Risks and blockers", ("blocked", "risk", "fails", "failure", "outage", "bug", "truncate", "bottleneck", "hang")),
            Section("Follow-ups", ("i will", "write up", "spike", "by wednesday", "ship", "estimate")),
        ),
    ),
    "one_on_one": Template(
        id="one_on_one",
        label="One-on-one",
        description="Topics raised, feedback exchanged and what each person owns.",
        sections=(
            Section("Topics raised", ("i think", "my read", "question", "want to", "concerned", "feel")),
            Section("Feedback", ("good", "better", "wrong", "should", "agree", "disagree", "fair")),
            Section("Owned next", ("i will", "take that", "own it", "by friday", "next week")),
        ),
    ),
    "product": Template(
        id="product",
        label="Product review",
        description="User problems, product decisions and what got prioritised.",
        sections=(
            Section("User problems", ("customer", "user", "churn", "complain", "cannot find", "manually", "asked for")),
            Section("Product decisions", ("decided", "we ship", "cut", "defer", "priority", "roadmap", "quarter")),
            Section("Evidence cited", ("percent", "%", "measured", "instrumented", "number", "data")),
            Section("Open questions", ("?", "not sure", "unclear", "do we", "should we")),
        ),
    ),
}

DEFAULT_TEMPLATE = "general"


def get(template_id: str) -> Template:
    return TEMPLATES.get(template_id, TEMPLATES[DEFAULT_TEMPLATE])
