from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class PermissionMode(Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class TierLimits:
    max_models: int
    max_rounds: int
    sub_agents: bool
    deep_mode: bool
    blind_mode: bool
    jury_mode: bool
    market_mode: bool
    max_debates_per_hour: int
    max_context_tokens: int

    @classmethod
    def for_tier(cls, mode: PermissionMode) -> TierLimits:
        return _TIER_CONFIGS.get(mode, _TIER_CONFIGS[PermissionMode.FREE])


_TIER_CONFIGS: dict[PermissionMode, TierLimits] = {
    PermissionMode.FREE: TierLimits(
        max_models=2,
        max_rounds=2,
        sub_agents=False,
        deep_mode=False,
        blind_mode=False,
        jury_mode=False,
        market_mode=False,
        max_debates_per_hour=5,
        max_context_tokens=8000,
    ),
    PermissionMode.BASIC: TierLimits(
        max_models=3,
        max_rounds=3,
        sub_agents=False,
        deep_mode=True,
        blind_mode=True,
        jury_mode=False,
        market_mode=False,
        max_debates_per_hour=20,
        max_context_tokens=16000,
    ),
    PermissionMode.PRO: TierLimits(
        max_models=5,
        max_rounds=5,
        sub_agents=True,
        deep_mode=True,
        blind_mode=True,
        jury_mode=True,
        market_mode=True,
        max_debates_per_hour=100,
        max_context_tokens=64000,
    ),
    PermissionMode.ENTERPRISE: TierLimits(
        max_models=10,
        max_rounds=10,
        sub_agents=True,
        deep_mode=True,
        blind_mode=True,
        jury_mode=True,
        market_mode=True,
        max_debates_per_hour=1000,
        max_context_tokens=200000,
    ),
}


@dataclass
class EnforcementResult:
    allowed: bool
    reason: str | None = None
    adjusted: dict[str, Any] = field(default_factory=dict)


class PermissionEnforcer:

    def __init__(self, mode: PermissionMode = PermissionMode.FREE):
        self._mode = mode
        self._limits = TierLimits.for_tier(mode)

    @property
    def mode(self) -> PermissionMode:
        return self._mode

    @property
    def limits(self) -> TierLimits:
        return self._limits

    def check_debate_request(
        self,
        model_count: int,
        round_count: int,
        mode: str,
        sub_agents: bool = False,
    ) -> EnforcementResult:
        adjusted: dict[str, Any] = {}

        if model_count > self._limits.max_models:
            adjusted["models"] = self._limits.max_models

        if round_count > self._limits.max_rounds:
            adjusted["rounds"] = self._limits.max_rounds

        if sub_agents and not self._limits.sub_agents:
            adjusted["sub_agents"] = False

        mode_checks = {
            "deep": self._limits.deep_mode,
            "blind": self._limits.blind_mode,
            "jury": self._limits.jury_mode,
            "market": self._limits.market_mode,
        }

        if mode in mode_checks and not mode_checks[mode]:
            return EnforcementResult(
                allowed=False,
                reason=f"Mode '{mode}' is not available on the {self._mode.value} tier",
            )

        if adjusted:
            logger.info(
                "Tier %s: adjusted debate parameters: %s",
                self._mode.value, adjusted,
            )
            return EnforcementResult(allowed=True, adjusted=adjusted)

        return EnforcementResult(allowed=True)

    def check_context_size(self, token_count: int) -> EnforcementResult:
        if token_count > self._limits.max_context_tokens:
            return EnforcementResult(
                allowed=False,
                reason=f"Context size {token_count} exceeds {self._mode.value} tier limit of {self._limits.max_context_tokens}",
            )
        return EnforcementResult(allowed=True)
