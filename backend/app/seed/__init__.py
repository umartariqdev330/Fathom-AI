"""Seeded content for the demo workspace.

One module per meeting. Each exports a dict with transcript blocks, a summary,
action items and highlights. `seed.py` turns these into database rows.
"""

from app.seed.architecture_review import ARCHITECTURE_REVIEW
from app.seed.base import SAMPLE_VIDEO, build_segments
from app.seed.client_discovery import CLIENT_DISCOVERY
from app.seed.customer_feedback import CUSTOMER_FEEDBACK
from app.seed.design_review import DESIGN_REVIEW
from app.seed.engineering_standup import ENGINEERING_STANDUP
from app.seed.investor_update import INVESTOR_UPDATE
from app.seed.product_strategy import PRODUCT_STRATEGY
from app.seed.sprint_planning import SPRINT_PLANNING
from app.seed.upcoming import SIMULATED_RECORDING, UPCOMING

MEETINGS = [
    PRODUCT_STRATEGY,
    ENGINEERING_STANDUP,
    CLIENT_DISCOVERY,
    ARCHITECTURE_REVIEW,
    SPRINT_PLANNING,
    INVESTOR_UPDATE,
    DESIGN_REVIEW,
    CUSTOMER_FEEDBACK,
]

__all__ = ["MEETINGS", "UPCOMING", "SIMULATED_RECORDING", "SAMPLE_VIDEO", "build_segments"]
