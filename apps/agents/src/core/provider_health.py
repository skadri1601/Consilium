from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ProviderState(Enum):
    UNCONFIGURED = "unconfigured"
    CHECKING = "checking"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


@dataclass
class EndpointHealth:
    name: str
    healthy: bool
    latency_ms: int = 0
    last_error: str | None = None
    last_check: float = 0.0
    consecutive_failures: int = 0

    def record_success(self, latency_ms: int) -> None:
        self.healthy = True
        self.latency_ms = latency_ms
        self.last_error = None
        self.last_check = time.time()
        self.consecutive_failures = 0

    def record_failure(self, error: str) -> None:
        self.healthy = False
        self.last_error = error
        self.last_check = time.time()
        self.consecutive_failures += 1


@dataclass
class ProviderHealthReport:
    provider: str
    state: ProviderState
    endpoints: list[EndpointHealth]
    last_check: float
    models_available: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "state": self.state.value,
            "endpoints": [
                {
                    "name": ep.name,
                    "healthy": ep.healthy,
                    "latency_ms": ep.latency_ms,
                    "last_error": ep.last_error,
                    "consecutive_failures": ep.consecutive_failures,
                }
                for ep in self.endpoints
            ],
            "models_available": self.models_available,
        }


class ProviderHealthTracker:

    def __init__(self):
        self._providers: dict[str, ProviderHealthReport] = {}
        self._check_interval = 60.0

    def register_provider(self, provider: str, models: list[str] | None = None) -> None:
        self._providers[provider] = ProviderHealthReport(
            provider=provider,
            state=ProviderState.UNCONFIGURED,
            endpoints=[
                EndpointHealth(name="chat_completions", healthy=False),
                EndpointHealth(name="health", healthy=False),
            ],
            last_check=0.0,
            models_available=models or [],
        )

    def record_success(self, provider: str, endpoint: str = "chat_completions", latency_ms: int = 0) -> None:
        report = self._providers.get(provider)
        if not report:
            return
        for ep in report.endpoints:
            if ep.name == endpoint:
                ep.record_success(latency_ms)
                break
        self._update_state(provider)

    def record_failure(self, provider: str, endpoint: str = "chat_completions", error: str = "") -> None:
        report = self._providers.get(provider)
        if not report:
            return
        for ep in report.endpoints:
            if ep.name == endpoint:
                ep.record_failure(error)
                break
        self._update_state(provider)

    def _update_state(self, provider: str) -> None:
        report = self._providers.get(provider)
        if not report:
            return

        report.last_check = time.time()
        healthy_count = sum(1 for ep in report.endpoints if ep.healthy)
        total = len(report.endpoints)

        if healthy_count == total:
            report.state = ProviderState.HEALTHY
        elif healthy_count > 0:
            report.state = ProviderState.DEGRADED
        else:
            report.state = ProviderState.FAILED

    def get_state(self, provider: str) -> ProviderState:
        report = self._providers.get(provider)
        return report.state if report else ProviderState.UNCONFIGURED

    def is_available(self, provider: str) -> bool:
        state = self.get_state(provider)
        return state in (ProviderState.HEALTHY, ProviderState.DEGRADED)

    def get_healthy_providers(self) -> list[str]:
        return [
            p for p, r in self._providers.items()
            if r.state in (ProviderState.HEALTHY, ProviderState.DEGRADED)
        ]

    def get_report(self, provider: str) -> ProviderHealthReport | None:
        return self._providers.get(provider)

    def full_report(self) -> dict[str, Any]:
        return {
            "providers": {
                p: r.to_dict() for p, r in self._providers.items()
            },
            "summary": {
                "total": len(self._providers),
                "healthy": sum(1 for r in self._providers.values() if r.state == ProviderState.HEALTHY),
                "degraded": sum(1 for r in self._providers.values() if r.state == ProviderState.DEGRADED),
                "failed": sum(1 for r in self._providers.values() if r.state == ProviderState.FAILED),
            },
        }

    def needs_check(self, provider: str) -> bool:
        report = self._providers.get(provider)
        if not report:
            return True
        return (time.time() - report.last_check) > self._check_interval


provider_health = ProviderHealthTracker()
