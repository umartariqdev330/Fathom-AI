"""AI summarisation with a deterministic fallback.

If OPENAI_API_KEY is set the transcript goes to the LLM. If it is not, which is
the normal case for a reviewer cloning this repo, the summary is derived from the
transcript locally. The product never depends on an external API being reachable.
"""

import json
import os
from collections import Counter

import httpx

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
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
    if os.getenv("OPENAI_API_KEY"):
        try:
            return _llm_summary(title, segments)
        except Exception:
            pass  # a flaky API must never cost the user their summary
    return _local_summary(title, segments)


def _llm_summary(title: str, segments: list[dict]) -> dict:
    transcript = "\n".join(f"{s['speaker']}: {s['text']}" for s in segments)
    response = httpx.post(
        API_URL,
        headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]},
        json={
            "model": MODEL,
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
