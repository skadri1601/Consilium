from dataclasses import dataclass, field
from typing import Optional

VALID_SOURCES = {"slack", "monitor", "scheduled"}
VALID_ESCALATION_POLICIES = {"alert_slack", "log", "abort"}


@dataclass
class TaskPacket:
    objective: str
    scope: str
    source: str
    priority: int = 3
    acceptance_criteria: list[str] = field(default_factory=list)
    escalation_policy: str = "log"
    metadata: dict = field(default_factory=dict)


@dataclass
class ValidatedPacket:
    objective: str
    scope: str
    source: str
    priority: int
    acceptance_criteria: list[str]
    escalation_policy: str
    metadata: dict


def validate_packet(packet: TaskPacket) -> ValidatedPacket:
    if not packet.objective or not packet.objective.strip():
        raise ValueError("objective must be non-empty")

    if not isinstance(packet.priority, int) or not (1 <= packet.priority <= 5):
        raise ValueError(f"priority must be int 1-5, got {packet.priority}")

    if packet.source not in VALID_SOURCES:
        raise ValueError(f"source must be one of {VALID_SOURCES}, got {packet.source!r}")

    if packet.escalation_policy not in VALID_ESCALATION_POLICIES:
        raise ValueError(
            f"escalation_policy must be one of {VALID_ESCALATION_POLICIES}, got {packet.escalation_policy!r}"
        )

    return ValidatedPacket(
        objective=packet.objective.strip(),
        scope=packet.scope,
        source=packet.source,
        priority=packet.priority,
        acceptance_criteria=list(packet.acceptance_criteria),
        escalation_policy=packet.escalation_policy,
        metadata=dict(packet.metadata),
    )
