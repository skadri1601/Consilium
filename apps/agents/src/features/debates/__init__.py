"""Debates feature module."""

from .router import router as debates_router
from .service import DebatesService
from .schema import DebateStartRequest, DebateStartResponse, ApiKeys

__all__ = [
    "debates_router",
    "DebatesService",
    "DebateStartRequest",
    "DebateStartResponse",
    "ApiKeys",
]
