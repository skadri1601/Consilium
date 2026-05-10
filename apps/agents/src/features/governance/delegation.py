from __future__ import annotations

from src.features.governance.types import DelegationScope


class DelegationManager:
    def __init__(self) -> None:
        self._delegations: dict[tuple[str, str], DelegationScope] = {}

    def grant(self, parent_id: str, child_id: str, scope: DelegationScope) -> None:
        self._delegations[(parent_id, child_id)] = scope

    def check(self, agent_id: str, action: str) -> bool:
        for (_, child_id), scope in self._delegations.items():
            if child_id == agent_id and action in scope.allowed_actions:
                return True
        return False

    def revoke(self, parent_id: str, child_id: str) -> None:
        self._delegations.pop((parent_id, child_id), None)

    def list_delegations(self, parent_id: str) -> list[tuple[str, DelegationScope]]:
        return [
            (child_id, scope)
            for (pid, child_id), scope in self._delegations.items()
            if pid == parent_id
        ]
