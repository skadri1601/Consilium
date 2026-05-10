from __future__ import annotations

from src.features.governance.types import BudgetLimit


class BudgetTracker:
    def __init__(self) -> None:
        self._spends: dict[str, dict] = {}

    def set_limit(self, limit: BudgetLimit) -> None:
        agent_id = limit.agent_id
        if agent_id not in self._spends:
            self._spends[agent_id] = {"daily": 0.0, "monthly": 0.0, "limits": limit}
        else:
            self._spends[agent_id]["limits"] = limit

    def check(self, agent_id: str, cost: float) -> bool:
        if agent_id not in self._spends:
            return True
        entry = self._spends[agent_id]
        limits: BudgetLimit = entry["limits"]
        if limits.daily_limit > 0 and entry["daily"] + cost > limits.daily_limit:
            return False
        if limits.monthly_limit > 0 and entry["monthly"] + cost > limits.monthly_limit:
            return False
        return True

    def record(self, agent_id: str, cost: float) -> None:
        if agent_id not in self._spends:
            return
        self._spends[agent_id]["daily"] += cost
        self._spends[agent_id]["monthly"] += cost

    def get_remaining(self, agent_id: str) -> dict:
        if agent_id not in self._spends:
            return {"daily_remaining": float("inf"), "monthly_remaining": float("inf")}
        entry = self._spends[agent_id]
        limits: BudgetLimit = entry["limits"]
        daily_remaining = limits.daily_limit - entry["daily"] if limits.daily_limit > 0 else float("inf")
        monthly_remaining = limits.monthly_limit - entry["monthly"] if limits.monthly_limit > 0 else float("inf")
        return {"daily_remaining": daily_remaining, "monthly_remaining": monthly_remaining}

    def reset_daily(self) -> None:
        for agent_id in self._spends:
            self._spends[agent_id]["daily"] = 0.0
