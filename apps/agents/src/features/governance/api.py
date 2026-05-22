from __future__ import annotations

import logging
from dataclasses import asdict
from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from src.features.governance.budget import BudgetTracker
from src.features.governance.delegation import DelegationManager
from src.features.governance.policy import PolicyEngine
from src.features.governance.types import PolicyAction, PolicyRule

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/governance", tags=["governance"])


@lru_cache(maxsize=1)
def get_policy_engine() -> PolicyEngine:
    return PolicyEngine()


@lru_cache(maxsize=1)
def get_budget_tracker() -> BudgetTracker:
    return BudgetTracker()


@lru_cache(maxsize=1)
def get_delegation_manager() -> DelegationManager:
    return DelegationManager()


class EvaluateRequest(BaseModel):
    agent_type: str = Field(..., min_length=1)
    action_type: str = Field(..., min_length=1)
    amount: float = Field(default=0, ge=0)
    resource: str = ""


class PolicyRuleRequest(BaseModel):
    id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    conditions: dict[str, Any] = Field(..., min_length=1)
    action: PolicyAction
    priority: int = 0

    @field_validator("action", mode="before")
    @classmethod
    def _coerce_action(cls, value: Any) -> Any:
        if isinstance(value, PolicyAction):
            return value
        if isinstance(value, str):
            try:
                return PolicyAction(value)
            except ValueError as exc:
                raise ValueError(
                    f"invalid action {value!r}; allowed: {[a.value for a in PolicyAction]}"
                ) from exc
        raise ValueError(f"action must be a string or PolicyAction, got {type(value).__name__}")


@router.post("/evaluate")
def evaluate_action(
    req: EvaluateRequest,
    policy_engine: PolicyEngine = Depends(get_policy_engine),
) -> dict:
    action = {
        "agent_type": req.agent_type,
        "action_type": req.action_type,
        "amount": req.amount,
        "resource": req.resource,
    }
    try:
        decision = policy_engine.evaluate(action)
        return {
            "allowed": decision.allowed,
            "action": decision.action.value,
            "reason": decision.reason,
            "matching_rule": (
                asdict(decision.matching_rule) if decision.matching_rule else None
            ),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("policy_engine.evaluate failed for action=%s", action)
        raise HTTPException(status_code=500, detail="Policy evaluation failed") from exc


@router.post("/policies")
def register_policy(
    req: PolicyRuleRequest,
    policy_engine: PolicyEngine = Depends(get_policy_engine),
) -> dict:
    rule = PolicyRule(
        id=req.id,
        name=req.name,
        conditions=req.conditions,
        action=req.action,
        priority=req.priority,
    )
    policy_engine.register_policy(rule)
    return {"status": "registered"}


@router.get("/policies")
def list_policies(
    policy_engine: PolicyEngine = Depends(get_policy_engine),
) -> list[dict]:
    return [asdict(r) for r in policy_engine.rules]


@router.get("/budget/{agent_id}")
def get_budget(
    agent_id: str,
    budget_tracker: BudgetTracker = Depends(get_budget_tracker),
) -> dict:
    try:
        result = budget_tracker.get_remaining(agent_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id!r} not found") from exc
    except Exception as exc:
        logger.exception("get_remaining failed for agent_id=%s", agent_id)
        raise HTTPException(status_code=500, detail="Budget lookup failed") from exc
    if result is None:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id!r} not found")
    return result
