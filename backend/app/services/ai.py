"""AI summarisation with a deterministic fallback.

With an API key configured, in the environment or from the Settings page, the
transcript goes to the LLM. Without one the summary is derived from the
transcript locally. The product never depends on an external API being reachable.
"""

import json
from collections import Counter

import httpx

from app.services import config

API_URL = "https://api.openai.com/v1/chat/completions"

PROMPT = """You are a meeting assistant. Summarise this transcript.
Return JSON with keys: overview (2-3 sentences), key_points (3-6 strings),
decisions (strings), topics (3-6 short tags), insights (2-4 observations),
action_items (objects with task, assignee, due_date).

Meeting: {title}
Transcript:
{transcript}"""

STOPWORDS = {
    "the", "and", "that", "this", "with", "have", "what", "were", "your", "from",
    "they", "them", "then", "than", "about", "would", "there", "their", "which",
    "been", "will", "just", "know", "think", "going", "really", "want", "make",
    "like", "yeah", "okay", "right", "into", "some", "when", "because", "should",
}

DECISION_PHRASES = ("decided", "agreed", "we are going with", "lets ship", "sign off")
ACTION_PHRASES = ("can you ", "we need to ", "by friday", "next week", "follow up", "take that")


def summarise(title: str, segments: list[dict]) -> dict:
    """segments: [{speaker, start_time, end_time, text}, ...]"""
    if not config.api_key():
        return {
            "overview": "No OpenAI API key configured. Configure an API key in Settings to generate AI summaries.",
            "key_points": [],
            "decisions": [],
            "topics": [],
            "insights": [],
            "action_items": [],
            "generated_by": "none",
        }
    return _validated(_llm_summary(title, segments), title, segments)


def _validated(data: dict, title: str, segments: list[dict]) -> dict:
    """Coerce a model response into the shape the database expects.

    A model can return a string where a list belongs, or omit a key entirely.
    Storing that unchecked is how a bad response becomes a broken meeting page.
    """
    if not isinstance(data, dict) or not str(data.get("overview", "")).strip():
        raise ValueError("Summary response has no overview")

    clean = {"overview": str(data["overview"]).strip(), "generated_by": "llm"}

    for key in ("key_points", "decisions", "topics", "insights"):
        value = data.get(key) or []
        clean[key] = [str(item).strip() for item in value if str(item).strip()] if isinstance(value, list) else []

    items = data.get("action_items") or []
    clean["action_items"] = [
        {
            "task": str(item["task"]).strip()[:300],
            "assignee": (str(item.get("assignee")).strip() if item.get("assignee") else None),
            "due_date": (str(item.get("due_date")).strip() if item.get("due_date") else None),
        }
        for item in items
        if isinstance(item, dict) and str(item.get("task", "")).strip()
    ]
    return clean


def _llm_summary(title: str, segments: list[dict]) -> dict:
    transcript = "\n".join(f"{s['speaker']}: {s['text']}" for s in segments)
    response = httpx.post(
        API_URL,
        headers={"Authorization": "Bearer " + (config.api_key() or "")},
        json={
            "model": config.summary_model(),
            "messages": [
                {"role": "user", "content": PROMPT.format(title=title, transcript=transcript)}
            ],
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    response.raise_for_status()
    data = json.loads(response.json()["choices"][0]["message"]["content"])
    data["generated_by"] = "llm"
    return data


def _local_summary(title: str, segments: list[dict]) -> dict:
    speakers = list(dict.fromkeys(s["speaker"] for s in segments))
    longest = sorted(segments, key=lambda s: len(s["text"]), reverse=True)
    topics = _topics(segments)

    insights = [f"{len(segments)} transcript segments captured across {len(speakers)} speakers."]
    if len(speakers) > 1:
        insights.insert(0, f"{speakers[0]} and {speakers[1]} drove most of the discussion.")

    return {
        "overview": (
            f"{title} ran for {_duration(segments)} with {_count(len(speakers), 'participant')}. "
            f"The group covered {', '.join(topics[:3]) or 'several topics'}."
        ),
        "key_points": [s["text"].strip() for s in longest[:4]],
        "decisions": [s["text"].strip() for s in segments if _matches(s["text"], DECISION_PHRASES)][:3],
        "topics": topics,
        "insights": insights,
        "action_items": [
            {"task": s["text"].strip()[:120], "assignee": s["speaker"], "due_date": None}
            for s in segments
            if _matches(s["text"], ACTION_PHRASES)
        ][:5],
        "generated_by": "mock",
    }


def _count(value: int, noun: str) -> str:
    return f"{value} {noun}" if value == 1 else f"{value} {noun}s"


TEMPLATE_PROMPT = """Summarise this meeting transcript under exactly these headings: {labels}.
Return JSON: {{"overview": "2-3 sentences", "sections": {{"<heading>": ["point", ...]}}}}.
Use 2-4 points per heading. Omit a heading only if the meeting genuinely covers nothing for it.

Meeting: {title}
Transcript:
{transcript}"""


def apply_template(title: str, segments: list[dict], template) -> dict:
    """Re-read a meeting under one of the summary templates."""
    if not config.api_key():
        return {
            "overview": "No OpenAI API key configured. Configure an API key in Settings to generate AI summaries.",
            "sections": [],
            "action_items": [],
            "generated_by": "none",
        }
    return _llm_template(title, segments, template)


def _llm_template(title: str, segments: list[dict], template) -> dict:
    transcript = "\n".join(f"{s['speaker']}: {s['text']}" for s in segments)
    labels = ", ".join(section.label for section in template.sections)
    response = httpx.post(
        API_URL,
        headers={"Authorization": "Bearer " + (config.api_key() or "")},
        json={
            "model": config.summary_model(),
            "messages": [
                {
                    "role": "user",
                    "content": TEMPLATE_PROMPT.format(labels=labels, title=title, transcript=transcript),
                }
            ],
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    response.raise_for_status()
    data = json.loads(response.json()["choices"][0]["message"]["content"])
    sections = [
        {"label": section.label, "items": [{"text": point, "timestamp": None} for point in data["sections"].get(section.label, [])]}
        for section in template.sections
    ]
    return {
        "overview": data.get("overview", ""),
        "sections": [s for s in sections if s["items"]],
        "topics": _topics(segments),
        "generated_by": "llm",
    }


def _local_template(title: str, segments: list[dict], template) -> dict:
    """Pull the lines that match each section's cues.

    Items are transcript lines rather than paraphrases, so the timestamp on each
    one is exact and clicking it lands on the moment it came from.
    """
    used: set[int] = set()
    sections = []

    for section in template.sections:
        matches = [
            s
            for i, s in enumerate(segments)
            if i not in used and _matches(s["text"], section.cues) and len(s["text"]) > 60
        ]
        chosen = sorted(matches, key=lambda s: len(s["text"]), reverse=True)[:3]
        used.update(segments.index(s) for s in chosen)

        if chosen:
            sections.append(
                {
                    "label": section.label,
                    "items": [
                        {"text": s["text"], "timestamp": s["start_time"]}
                        for s in sorted(chosen, key=lambda s: s["start_time"])
                    ],
                }
            )

    return {
        "overview": _local_summary(title, segments)["overview"],
        "sections": sections,
        "topics": _topics(segments),
        "generated_by": "mock",
    }


def _duration(segments: list[dict]) -> str:
    if not segments:
        return "0 minutes"
    seconds = max(s.get("end_time", s["start_time"]) for s in segments)
    return _count(max(1, round(seconds / 60)), "minute")


def _topics(segments: list[dict]) -> list[str]:
    words = Counter()
    for segment in segments:
        for raw in segment["text"].lower().split():
            word = raw.strip(".,!?:;()[]\"")
            if len(word) > 4 and word not in STOPWORDS:
                words[word] += 1
    return [word.title() for word, _ in words.most_common(5)]


def _matches(text: str, phrases: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(phrase in lowered for phrase in phrases)
