from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import redis

from agents.config import REDIS_URL


class LaneStatus(str, Enum):
    STARTED = "started"
    TICKET_CREATED = "ticket_created"
    BRANCH_CREATED = "branch_created"
    PR_OPENED = "pr_opened"
    REVIEW_IN_PROGRESS = "review_in_progress"
    CI_RUNNING = "ci_running"
    CI_GREEN = "ci_green"
    CI_RED = "ci_red"
    MERGE_READY = "merge_ready"
    MERGED = "merged"
    VERIFIED = "verified"
    FAILED = "failed"
    CLOSED = "closed"


class LaneFailureClass(str, Enum):
    SENTRY_ERROR = "sentry_error"
    SONARQUBE_FAILURE = "sonarqube_failure"
    CI_FAILURE = "ci_failure"
    DEPLOY_FAILURE = "deploy_failure"
    TEST_FAILURE = "test_failure"
    TIMEOUT = "timeout"
    MANUAL = "manual"


class PolicyAction(str, Enum):
    NOTIFY_SLACK = "notify_slack"
    CREATE_TICKET = "create_ticket"
    UPDATE_TICKET = "update_ticket"
    TRANSITION_TICKET = "transition_ticket"
    CLOSE_LANE = "close_lane"
    ESCALATE = "escalate"
    VERIFY_RESOLUTION = "verify_resolution"


@dataclass
class LaneEvent:
    status: LaneStatus
    emitted_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    failure_class: Optional[LaneFailureClass] = None
    detail: Optional[str] = None
    data: Optional[dict] = None


@dataclass
class Lane:
    lane_id: str
    ticket_id: str
    title: str
    source: str
    status: LaneStatus = LaneStatus.STARTED
    events: list[dict] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error_fingerprint: Optional[str] = None
    pr_number: Optional[int] = None
    branch_name: Optional[str] = None
    merge_sha: Optional[str] = None
    verified_at: Optional[str] = None


@dataclass
class LaneContext:
    lane_id: str
    status: LaneStatus
    ci_green: bool
    has_pr: bool
    review_approved: bool
    time_since_creation: float
    merge_ready: bool


class PolicyCondition:
    def evaluate(self, context: LaneContext) -> bool:
        raise NotImplementedError


class StatusIs(PolicyCondition):
    def __init__(self, status: LaneStatus):
        self.status = status

    def evaluate(self, context: LaneContext) -> bool:
        return context.status == self.status


class CIGreen(PolicyCondition):
    def evaluate(self, context: LaneContext) -> bool:
        return context.ci_green


class ReviewApproved(PolicyCondition):
    def evaluate(self, context: LaneContext) -> bool:
        return context.review_approved


class HasPR(PolicyCondition):
    def evaluate(self, context: LaneContext) -> bool:
        return context.has_pr


class TimedOut(PolicyCondition):
    def __init__(self, seconds: float):
        self.seconds = seconds

    def evaluate(self, context: LaneContext) -> bool:
        return context.time_since_creation >= self.seconds


class MergeReady(PolicyCondition):
    def evaluate(self, context: LaneContext) -> bool:
        return context.merge_ready


class AND(PolicyCondition):
    def __init__(self, *conditions: PolicyCondition):
        self.conditions = conditions

    def evaluate(self, context: LaneContext) -> bool:
        return all(c.evaluate(context) for c in self.conditions)


class OR(PolicyCondition):
    def __init__(self, *conditions: PolicyCondition):
        self.conditions = conditions

    def evaluate(self, context: LaneContext) -> bool:
        return any(c.evaluate(context) for c in self.conditions)


@dataclass
class PolicyRule:
    name: str
    condition: PolicyCondition
    action: list[PolicyAction]
    priority: int = 0


class PolicyEngine:
    def __init__(self):
        self.rules: list[PolicyRule] = sorted(self._default_rules(), key=lambda r: r.priority)

    def evaluate(self, context: LaneContext) -> list[PolicyAction]:
        actions = []
        for rule in self.rules:
            if rule.condition.evaluate(context):
                actions.extend(rule.action)
        return actions

    @staticmethod
    def _default_rules() -> list[PolicyRule]:
        return [
            PolicyRule(
                name="merge_ready_check",
                condition=AND(CIGreen(), ReviewApproved(), HasPR()),
                action=[PolicyAction.UPDATE_TICKET],
                priority=1,
            ),
            PolicyRule(
                name="verify_after_merge",
                condition=AND(StatusIs(LaneStatus.MERGED), TimedOut(3600)),
                action=[PolicyAction.VERIFY_RESOLUTION],
                priority=2,
            ),
            PolicyRule(
                name="close_verified",
                condition=StatusIs(LaneStatus.VERIFIED),
                action=[PolicyAction.CLOSE_LANE, PolicyAction.TRANSITION_TICKET],
                priority=3,
            ),
            PolicyRule(
                name="ci_red_alert",
                condition=StatusIs(LaneStatus.CI_RED),
                action=[PolicyAction.NOTIFY_SLACK, PolicyAction.ESCALATE],
                priority=4,
            ),
            PolicyRule(
                name="stale_escalation",
                condition=TimedOut(86400),
                action=[PolicyAction.ESCALATE],
                priority=5,
            ),
        ]


_LANE_PREFIX = "consilium:lane:"
_LANE_TTL = 30 * 86400
_redis_client = None
_redis_available = False

try:
    if REDIS_URL:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        _redis_client.ping()
        _redis_available = True
except Exception:
    _redis_available = False


class LaneRegistry:
    def __init__(self, engine: PolicyEngine | None = None):
        self.engine = engine or PolicyEngine()
        self._memory: dict[str, dict] = {}

    def _redis_key(self, lane_id: str) -> str:
        return _LANE_PREFIX + lane_id

    def _store(self, lane: Lane) -> None:
        data = asdict(lane)
        data["status"] = lane.status.value
        serialized = json.dumps(data, default=str)
        if _redis_available:
            try:
                _redis_client.setex(self._redis_key(lane.lane_id), _LANE_TTL, serialized)
                return
            except Exception:
                pass
        self._memory[lane.lane_id] = data

    def _load(self, lane_id: str) -> Lane | None:
        raw = None
        if _redis_available:
            try:
                raw = _redis_client.get(self._redis_key(lane_id))
            except Exception:
                pass
        if raw is None:
            data = self._memory.get(lane_id)
        else:
            data = json.loads(raw)
        if data is None:
            return None
        data["status"] = LaneStatus(data["status"])
        return Lane(**{k: v for k, v in data.items() if k in Lane.__dataclass_fields__})

    def _all_lane_ids(self) -> list[str]:
        ids = set(self._memory.keys())
        if _redis_available:
            try:
                for key in _redis_client.scan_iter(match=_LANE_PREFIX + "*"):
                    ids.add(key.removeprefix(_LANE_PREFIX))
            except Exception:
                pass
        return list(ids)

    def create_lane(
        self,
        ticket_id: str,
        title: str,
        source: str,
        error_fingerprint: str | None = None,
    ) -> Lane:
        if error_fingerprint:
            existing = self.find_by_fingerprint(error_fingerprint)
            if existing:
                return existing
        lane = Lane(
            lane_id=uuid.uuid4().hex[:12],
            ticket_id=ticket_id,
            title=title,
            source=source,
            error_fingerprint=error_fingerprint,
        )
        event = LaneEvent(status=LaneStatus.STARTED)
        lane.events.append(asdict(event))
        self._store(lane)
        return lane

    def get_lane(self, lane_id: str) -> Lane | None:
        return self._load(lane_id)

    def find_by_ticket(self, ticket_id: str) -> Lane | None:
        for lid in self._all_lane_ids():
            lane = self._load(lid)
            if lane and lane.ticket_id == ticket_id:
                return lane
        return None

    def find_by_fingerprint(self, fingerprint: str) -> Lane | None:
        for lid in self._all_lane_ids():
            lane = self._load(lid)
            if lane and lane.error_fingerprint == fingerprint:
                return lane
        return None

    def advance(
        self,
        lane_id: str,
        new_status: LaneStatus,
        detail: str | None = None,
        data: dict | None = None,
    ) -> list[PolicyAction]:
        lane = self._load(lane_id)
        if lane is None:
            raise ValueError(f"Lane {lane_id} not found")
        lane.status = new_status
        lane.updated_at = datetime.now(timezone.utc).isoformat()
        event = LaneEvent(status=new_status, detail=detail, data=data)
        lane.events.append(asdict(event))

        if new_status == LaneStatus.VERIFIED:
            lane.verified_at = datetime.now(timezone.utc).isoformat()

        self._store(lane)

        created = datetime.fromisoformat(lane.created_at)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()

        context = LaneContext(
            lane_id=lane.lane_id,
            status=lane.status,
            ci_green=lane.status == LaneStatus.CI_GREEN,
            has_pr=lane.pr_number is not None,
            review_approved=lane.status in (LaneStatus.MERGE_READY, LaneStatus.MERGED),
            time_since_creation=elapsed,
            merge_ready=lane.status == LaneStatus.MERGE_READY,
        )
        return self.engine.evaluate(context)

    def get_active_lanes(self) -> list[Lane]:
        active = []
        closed = {LaneStatus.CLOSED, LaneStatus.FAILED, LaneStatus.VERIFIED}
        for lid in self._all_lane_ids():
            lane = self._load(lid)
            if lane and lane.status not in closed:
                active.append(lane)
        return active

    def close_lane(self, lane_id: str) -> None:
        lane = self._load(lane_id)
        if lane is None:
            return
        lane.status = LaneStatus.CLOSED
        lane.updated_at = datetime.now(timezone.utc).isoformat()
        event = LaneEvent(status=LaneStatus.CLOSED)
        lane.events.append(asdict(event))
        self._store(lane)
