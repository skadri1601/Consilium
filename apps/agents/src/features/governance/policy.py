from __future__ import annotations

from src.features.governance.types import PolicyAction, PolicyDecision, PolicyRule


class PolicyEngine:
    def __init__(self) -> None:
        self._rules: list[PolicyRule] = []

    def register_policy(self, rule: PolicyRule) -> None:
        self._rules.append(rule)

    def evaluate(self, action: dict) -> PolicyDecision:
        sorted_rules = sorted(self._rules, key=lambda r: r.priority, reverse=True)
        for rule in sorted_rules:
            if self._matches(rule, action):
                return PolicyDecision(
                    allowed=rule.action == PolicyAction.APPROVE,
                    action=rule.action,
                    matching_rule=rule,
                    reason=f"Matched rule: {rule.name}",
                )
        return PolicyDecision(
            allowed=True,
            action=PolicyAction.APPROVE,
            matching_rule=None,
            reason="No matching policy",
        )

    def _matches(self, rule: PolicyRule, action: dict) -> bool:
        for key, value in rule.conditions.items():
            if key == "amount_threshold":
                if "amount" not in action:
                    raise ValueError(
                        f"rule {rule.id!r} requires 'amount' on action but none was provided"
                    )
                amount = action["amount"]
                if not isinstance(amount, int | float):
                    raise ValueError(
                        f"rule {rule.id!r}: 'amount' must be numeric, got {type(amount).__name__}"
                    )
                if amount < value:
                    return False
            else:
                if action.get(key) != value:
                    return False
        return True

    @property
    def rules(self) -> list[PolicyRule]:
        return list(self._rules)
