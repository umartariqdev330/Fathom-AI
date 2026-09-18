"""Seeded meeting content.

Transcripts are written as blocks of consecutive lines. `build_segments` turns a
block into timed segments: lines inside a block run back to back at speaking
pace, and each block starts at its own offset. That mirrors how a condensed
transcript actually reads, with topic boundaries rather than an unbroken wall.
"""

CHARS_PER_SECOND = 14.0
LINE_GAP = 1.4


def build_segments(blocks: list[dict]) -> list[dict]:
    segments = []
    for block in blocks:
        time = float(block["start"])
        for speaker, text in block["lines"]:
            duration = max(3.0, len(text) / CHARS_PER_SECOND)
            segments.append(
                {
                    "speaker": speaker,
                    "start_time": round(time, 1),
                    "end_time": round(time + duration, 1),
                    "text": text,
                }
            )
            time += duration + LINE_GAP
    return segments


def person(name, role, email=None):
    handle = name.lower().replace(" ", ".")
    return {"name": name, "role": role, "email": email or f"{handle}@meetly.ai"}


SARAH = person("Sarah Chen", "VP Product")
MUHAMMAD = person("Muhammad Umar", "Engineering Lead")
ALEX = person("Alex Johnson", "Staff Engineer")
DANIEL = person("Daniel Kim", "Design Lead")
AYESHA = person("Ayesha Malik", "ML Engineer")
TOM = person("Tom Wilson", "Account Executive")
EMMA = person("Emma Davis", "Customer Success Lead")
RYAN = person("Ryan Cooper", "CTO")

# External attendees keep their own domains so the participant list reads true.
PRIYA = person("Priya Nair", "Head of Operations, Northwind", "priya.nair@northwind-logistics.com")
JAMES = person("James Okafor", "IT Director, Northwind", "james.okafor@northwind-logistics.com")
LENA = person("Lena Fischer", "Partner, Aldergate Capital", "lena@aldergate.vc")
MARCUS = person("Marcus Hale", "Principal, Aldergate Capital", "marcus@aldergate.vc")
NADIA = person("Dr. Nadia Rahman", "Clinical Director, Helio Health", "n.rahman@heliohealth.org")
CHRIS = person("Chris Bello", "Product Owner, Helio Health", "c.bello@heliohealth.org")

SAMPLE_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

VICTOR = person("Victor Osei", "Platform Engineer")
HANA = person("Hana Sato", "Security Engineer")
