from __future__ import annotations

import threading

from src.features.governance.types import DelegationScope


class DelegationManager:
    def __init__(self) -> None:
        self._delegations: dict[tuple[str, str], DelegationScope] = {}
        self._delegations_by_child: dict[str, list[tuple[tuple[str, str], DelegationScope]]] = {}
        self._lock = threading.Lock()

    def grant(self, parent_id: str, child_id: str, scope: DelegationScope) -> None:
        key = (parent_id, child_id)
        with self._lock:
            if key in self._delegations:
                self._remove_from_index(key)
            self._delegations[key] = scope
            self._delegations_by_child.setdefault(child_id, []).append((key, scope))

    def check(self, agent_id: str, action: str) -> bool:
        with self._lock:
            entries = self._delegations_by_child.get(agent_id, [])
            return any(action in scope.allowed_actions for _key, scope in entries)

    def revoke(self, parent_id: str, child_id: str) -> None:
        key = (parent_id, child_id)
        with self._lock:
            if self._delegations.pop(key, None) is not None:
                self._remove_from_index(key)

    def list_delegations(self, parent_id: str) -> list[tuple[str, DelegationScope]]:
        with self._lock:
            return [
                (child_id, scope)
                for (pid, child_id), scope in self._delegations.items()
                if pid == parent_id
            ]

    def _remove_from_index(self, key: tuple[str, str]) -> None:
        _parent, child_id = key
        bucket = self._delegations_by_child.get(child_id)
        if not bucket:
            return
        self._delegations_by_child[child_id] = [
            entry for entry in bucket if entry[0] != key
        ]
        if not self._delegations_by_child[child_id]:
            self._delegations_by_child.pop(child_id, None)
