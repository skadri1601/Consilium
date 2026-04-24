from .client import AsyncConsiliumClient, ConsiliumClient
from .exceptions import (
    AuthenticationError,
    ConsiliumError,
    RateLimitError,
    ServerError,
    TimeoutError,
)
from .types import (
    CostBreakdownEntry,
    CostEstimate,
    DeliberationMode,
    DeliberationResult,
    EvalResult,
    HealthStatus,
    RedTeamResult,
)

__all__ = [
    "AsyncConsiliumClient",
    "AuthenticationError",
    "ConsiliumClient",
    "ConsiliumError",
    "CostBreakdownEntry",
    "CostEstimate",
    "DeliberationMode",
    "DeliberationResult",
    "EvalResult",
    "HealthStatus",
    "RateLimitError",
    "RedTeamResult",
    "ServerError",
    "TimeoutError",
]

__version__ = "0.3.0"

try:
    from .mcp import main as mcp_main
    __all__.append("mcp_main")
except ImportError:
    pass
