"""Free-tier fallback package.

When a Consilium user dispatches a debate without BYOK (Bring Your
Own Keys), the engine routes their requested model to a tier-
equivalent free model hosted via Consilium's own Groq or OpenRouter
account. Users can switch to their own paid keys at any time by
setting the standard provider env vars or passing them in the
request ``api_keys`` dict.
"""

from .resolver import (
    FreeTierResolver,
    ModelResolution,
    FREE_TIER_ENV_VARS,
    TIER_EQUIVALENT_FREE_MODELS,
)

__all__ = [
    "FreeTierResolver",
    "ModelResolution",
    "FREE_TIER_ENV_VARS",
    "TIER_EQUIVALENT_FREE_MODELS",
]
