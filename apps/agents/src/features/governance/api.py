from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from src.features.governance.budget import BudgetTracker
from src.features.governance.delegation import DelegationManager
from src.features.governance.policy import PolicyEngine
from src.features.governance.types import PolicyAction, PolicyRule

router = APIRouter(prefix="/governance", tags=["governance"])

_policy_engine = PolicyEngine()
_budget_tracker = BudgetTracker()
_delegation_manager = DelegationManager()


class EvaluateRequest(BaseModel):
    agent_type: str
    action_type: str
    amount: float = 0
    resource: str = ""


class PolicyRuleRequest(BaseModel):
    id: str
    name: str
    conditions: dict[str, Any]
    action: str
    priority: int = 0


@router.post("/evaluate")
def evaluate_action(req: EvaluateRequest) -> dict:
    action = {
        "agent_type": req.agent_type,
        "action_type": req.action_type,
        "amount": req.amount,
        "resource": req.resource,
    }
    decision = _policy_engine.evaluate(action)
    result = {
        "allowed": decision.allowed,
        "action": decision.action.value,
        "reason": decision.reason,
        "matching_rule": asdict(decision.matching_rule) if decision.matching_rule else None,
    }
    return result


@router.post("/policies")
def register_policy(req: PolicyRuleRequest) -> dict:
    rule = PolicyRule(
        id=req.id,
        name=req.name,
        conditions=req.conditions,
        action=PolicyAction(req.action),
        priority=req.priority,
    )
    _policy_engine.register_policy(rule)
    return {"status": "registered"}


@router.get("/policies")
def list_policies() -> list[dict]:
    return [asdict(r) for r in _policy_engine.rules]


@router.get("/budget/{agent_id}")
def get_budget(agent_id: str) -> dict:
    return _budget_tracker.get_remaining(agent_id)
