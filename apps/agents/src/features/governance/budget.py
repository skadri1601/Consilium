from __future__ import annotations

import math
import threading

from src.features.governance.types import BudgetLimit


def _validate_cost(cost: float) -> None:
    if not isinstance(cost, int | float):
        raise ValueError(f"cost must be numeric, got {type(cost).__name__}")
    if isinstance(cost, float) and (math.isnan(cost) or math.isinf(cost)):
        raise ValueError(f"cost must be a finite number, got {cost!r}")
    if cost < 0:
        raise ValueError(f"cost must be >= 0, got {cost!r}")


class BudgetTracker:
    def __init__(self) -> None:
        self._spends: dict[str, dict] = {}
        self._lock = threading.Lock()

    def set_limit(self, limit: BudgetLimit) -> None:
        agent_id = limit.agent_id
        with self._lock:
            entry = self._spends.get(agent_id)
            if entry is None:
                self._spends[agent_id] = {"daily": 0.0, "monthly": 0.0, "limits": limit}
                return
            if limit.daily_limit > 0 and entry["daily"] > limit.daily_limit:
                raise ValueError(
                    f"existing daily spend {entry['daily']} exceeds new daily_limit "
                    f"{limit.daily_limit} for agent_id={agent_id!r}"
                )
            if limit.monthly_limit > 0 and entry["monthly"] > limit.monthly_limit:
                raise ValueError(
                    f"existing monthly spend {entry['monthly']} exceeds new monthly_limit "
                    f"{limit.monthly_limit} for agent_id={agent_id!r}"
                )
            entry["limits"] = limit

    def check(self, agent_id: str, cost: float) -> bool:
        _validate_cost(cost)
        with self._lock:
            return self._would_fit(agent_id, cost)

    def record(self, agent_id: str, cost: float) -> None:
        _validate_cost(cost)
        with self._lock:
            if agent_id not in self._spends:
                return
            self._spends[agent_id]["daily"] += cost
            self._spends[agent_id]["monthly"] += cost

    def try_charge(self, agent_id: str, cost: float) -> bool:
        """Atomically check and record. Returns True if the charge fit."""
        _validate_cost(cost)
        with self._lock:
            if not self._would_fit(agent_id, cost):
                return False
            if agent_id in self._spends:
                self._spends[agent_id]["daily"] += cost
                self._spends[agent_id]["monthly"] += cost
            return True

    def _would_fit(self, agent_id: str, cost: float) -> bool:
        if agent_id not in self._spends:
            return True
        entry = self._spends[agent_id]
        limits: BudgetLimit = entry["limits"]
        if limits.daily_limit > 0 and entry["daily"] + cost > limits.daily_limit:
            return False
        if limits.monthly_limit > 0 and entry["monthly"] + cost > limits.monthly_limit:
            return False
        return True

    def get_remaining(self, agent_id: str) -> dict:
        with self._lock:
            if agent_id not in self._spends:
                return {"daily_remaining": float("inf"), "monthly_remaining": float("inf")}
            entry = self._spends[agent_id]
            limits: BudgetLimit = entry["limits"]
            daily_remaining = (
                max(0.0, limits.daily_limit - entry["daily"])
                if limits.daily_limit > 0
                else float("inf")
            )
            monthly_remaining = (
                max(0.0, limits.monthly_limit - entry["monthly"])
                if limits.monthly_limit > 0
                else float("inf")
            )
            return {"daily_remaining": daily_remaining, "monthly_remaining": monthly_remaining}

    def reset_daily(self) -> None:
        with self._lock:
            for agent_id in self._spends:
                self._spends[agent_id]["daily"] = 0.0

    def reset_monthly(self) -> None:
        with self._lock:
            for agent_id in self._spends:
                self._spends[agent_id]["monthly"] = 0.0
