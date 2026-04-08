from __future__ import annotations

import asyncio
import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Callable, Generator

logger = logging.getLogger(__name__)


class FailureScenario(Enum):
    API_TIMEOUT = auto()
    SENTRY_UNREACHABLE = auto()
    LINEAR_UNREACHABLE = auto()
    SLACK_UNREACHABLE = auto()
    IMAP_FAILURE = auto()
    SONARQUBE_UNREACHABLE = auto()
    GITHUB_API_FAILURE = auto()
    REDIS_FAILURE = auto()
    CLAUDE_CLI_FAILURE = auto()
    TOOL_EXECUTION_FAILURE = auto()


class RecoveryStepKind(Enum):
    RETRY_AFTER = auto()
    RESTART_CONNECTION = auto()
    USE_FALLBACK = auto()
    SKIP_AND_LOG = auto()
    ESCALATE_TO_SLACK = auto()
    CLEAR_CACHE = auto()
    SWITCH_MODEL = auto()


@dataclass(frozen=True)
class RecoveryStep:
    kind: RecoveryStepKind
    value: Any = None

    @staticmethod
    def retry_after(seconds: int) -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.RETRY_AFTER, seconds)

    @staticmethod
    def restart_connection() -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.RESTART_CONNECTION)

    @staticmethod
    def use_fallback() -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.USE_FALLBACK)

    @staticmethod
    def skip_and_log() -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.SKIP_AND_LOG)

    @staticmethod
    def escalate_to_slack(message: str) -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.ESCALATE_TO_SLACK, message)

    @staticmethod
    def clear_cache() -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.CLEAR_CACHE)

    @staticmethod
    def switch_model(model: str) -> RecoveryStep:
        return RecoveryStep(RecoveryStepKind.SWITCH_MODEL, model)


class EscalationPolicy(Enum):
    ALERT_SLACK = auto()
    LOG_AND_CONTINUE = auto()
    ABORT = auto()


class RecoveryOutcome(Enum):
    RECOVERED = auto()
    PARTIAL = auto()
    ESCALATION_REQUIRED = auto()


@dataclass
class RecoveryResult:
    outcome: RecoveryOutcome
    steps_taken: list[RecoveryStep] = field(default_factory=list)
    remaining_steps: list[RecoveryStep] = field(default_factory=list)
    reason: str = ""

    @staticmethod
    def recovered(steps_taken: list[RecoveryStep]) -> RecoveryResult:
        return RecoveryResult(
            outcome=RecoveryOutcome.RECOVERED,
            steps_taken=steps_taken,
        )

    @staticmethod
    def partial(
        recovered_steps: list[RecoveryStep],
        remaining_steps: list[RecoveryStep],
    ) -> RecoveryResult:
        return RecoveryResult(
            outcome=RecoveryOutcome.PARTIAL,
            steps_taken=recovered_steps,
            remaining_steps=remaining_steps,
        )

    @staticmethod
    def escalation_required(reason: str) -> RecoveryResult:
        return RecoveryResult(
            outcome=RecoveryOutcome.ESCALATION_REQUIRED,
            reason=reason,
        )


@dataclass
class RecoveryRecipe:
    scenario: FailureScenario
    steps: list[RecoveryStep]
    max_attempts: int
    escalation_policy: EscalationPolicy


@dataclass
class RecoveryEvent:
    scenario: FailureScenario
    step: RecoveryStep
    succeeded: bool
    timestamp: float


@dataclass
class RecoveryContext:
    attempts: dict[FailureScenario, int] = field(default_factory=dict)
    events: list[RecoveryEvent] = field(default_factory=list)
    last_failure_at: dict[FailureScenario, float] = field(default_factory=dict)

    def record_attempt(self, scenario: FailureScenario) -> int:
        self.attempts[scenario] = self.attempts.get(scenario, 0) + 1
        self.last_failure_at[scenario] = time.time()
        return self.attempts[scenario]

    def record_event(
        self,
        scenario: FailureScenario,
        step: RecoveryStep,
        succeeded: bool,
    ) -> None:
        self.events.append(
            RecoveryEvent(
                scenario=scenario,
                step=step,
                succeeded=succeeded,
                timestamp=time.time(),
            )
        )

    def reset(self, scenario: FailureScenario) -> None:
        self.attempts.pop(scenario, None)
        self.last_failure_at.pop(scenario, None)


DEFAULT_RECIPES: dict[FailureScenario, RecoveryRecipe] = {
    FailureScenario.API_TIMEOUT: RecoveryRecipe(
        scenario=FailureScenario.API_TIMEOUT,
        steps=[
            RecoveryStep.retry_after(5),
            RecoveryStep.retry_after(15),
            RecoveryStep.retry_after(30),
        ],
        max_attempts=3,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
    FailureScenario.SENTRY_UNREACHABLE: RecoveryRecipe(
        scenario=FailureScenario.SENTRY_UNREACHABLE,
        steps=[
            RecoveryStep.retry_after(30),
            RecoveryStep.skip_and_log(),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
    FailureScenario.LINEAR_UNREACHABLE: RecoveryRecipe(
        scenario=FailureScenario.LINEAR_UNREACHABLE,
        steps=[
            RecoveryStep.retry_after(10),
            RecoveryStep.retry_after(30),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.ALERT_SLACK,
    ),
    FailureScenario.SLACK_UNREACHABLE: RecoveryRecipe(
        scenario=FailureScenario.SLACK_UNREACHABLE,
        steps=[
            RecoveryStep.retry_after(5),
            RecoveryStep.retry_after(15),
        ],
        max_attempts=3,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
    FailureScenario.IMAP_FAILURE: RecoveryRecipe(
        scenario=FailureScenario.IMAP_FAILURE,
        steps=[
            RecoveryStep.restart_connection(),
            RecoveryStep.retry_after(60),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
    FailureScenario.SONARQUBE_UNREACHABLE: RecoveryRecipe(
        scenario=FailureScenario.SONARQUBE_UNREACHABLE,
        steps=[
            RecoveryStep.retry_after(30),
            RecoveryStep.skip_and_log(),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
    FailureScenario.GITHUB_API_FAILURE: RecoveryRecipe(
        scenario=FailureScenario.GITHUB_API_FAILURE,
        steps=[
            RecoveryStep.retry_after(10),
            RecoveryStep.retry_after(30),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.ALERT_SLACK,
    ),
    FailureScenario.REDIS_FAILURE: RecoveryRecipe(
        scenario=FailureScenario.REDIS_FAILURE,
        steps=[
            RecoveryStep.retry_after(5),
            RecoveryStep.use_fallback(),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.ALERT_SLACK,
    ),
    FailureScenario.CLAUDE_CLI_FAILURE: RecoveryRecipe(
        scenario=FailureScenario.CLAUDE_CLI_FAILURE,
        steps=[
            RecoveryStep.retry_after(10),
            RecoveryStep.switch_model("haiku"),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.ALERT_SLACK,
    ),
    FailureScenario.TOOL_EXECUTION_FAILURE: RecoveryRecipe(
        scenario=FailureScenario.TOOL_EXECUTION_FAILURE,
        steps=[
            RecoveryStep.retry_after(5),
            RecoveryStep.skip_and_log(),
        ],
        max_attempts=2,
        escalation_policy=EscalationPolicy.LOG_AND_CONTINUE,
    ),
}


class RecoveryEngine:
    def __init__(
        self,
        recipes: dict[FailureScenario, RecoveryRecipe] | None = None,
    ) -> None:
        self.recipes: dict[FailureScenario, RecoveryRecipe] = (
            dict(DEFAULT_RECIPES) if recipes is None else recipes
        )
        self.context = RecoveryContext()

    def attempt_recovery(
        self,
        scenario: FailureScenario,
        execute_step_fn: Callable[[RecoveryStep], bool],
    ) -> RecoveryResult:
        recipe = self.recipes.get(scenario)
        if recipe is None:
            return RecoveryResult.escalation_required(
                f"No recipe defined for {scenario.name}"
            )

        attempt_number = self.context.record_attempt(scenario)
        if attempt_number > recipe.max_attempts:
            return self._handle_escalation(scenario, recipe)

        completed_steps: list[RecoveryStep] = []

        for i, step in enumerate(recipe.steps):
            if step.kind == RecoveryStepKind.RETRY_AFTER and step.value:
                time.sleep(step.value)

            try:
                succeeded = execute_step_fn(step)
            except Exception as exc:
                logger.warning(
                    "Recovery step %s failed for %s: %s",
                    step.kind.name,
                    scenario.name,
                    exc,
                )
                succeeded = False

            self.context.record_event(scenario, step, succeeded)

            if succeeded:
                completed_steps.append(step)
                self.context.reset(scenario)
                return RecoveryResult.recovered(completed_steps)

            completed_steps.append(step)

        remaining = recipe.steps[len(completed_steps):]
        if completed_steps and not remaining:
            return self._handle_escalation(scenario, recipe)

        return RecoveryResult.partial(completed_steps, remaining)

    def reset_scenario(self, scenario: FailureScenario) -> None:
        self.context.reset(scenario)

    def get_stats(self) -> dict[str, Any]:
        total_events = len(self.context.events)
        successes = sum(1 for e in self.context.events if e.succeeded)
        failures = total_events - successes
        per_scenario: dict[str, dict[str, Any]] = {}

        for scenario in FailureScenario:
            scenario_events = [
                e for e in self.context.events if e.scenario == scenario
            ]
            if not scenario_events:
                continue
            per_scenario[scenario.name] = {
                "attempts": self.context.attempts.get(scenario, 0),
                "total_events": len(scenario_events),
                "successes": sum(1 for e in scenario_events if e.succeeded),
                "failures": sum(1 for e in scenario_events if not e.succeeded),
                "last_failure_at": self.context.last_failure_at.get(scenario),
            }

        return {
            "total_events": total_events,
            "successes": successes,
            "failures": failures,
            "per_scenario": per_scenario,
        }

    def _handle_escalation(
        self,
        scenario: FailureScenario,
        recipe: RecoveryRecipe,
    ) -> RecoveryResult:
        policy = recipe.escalation_policy

        if policy == EscalationPolicy.ALERT_SLACK:
            logger.error(
                "ESCALATION [%s]: All %d recovery attempts exhausted — alerting Slack",
                scenario.name,
                recipe.max_attempts,
            )
            return RecoveryResult.escalation_required(
                f"{scenario.name}: all recovery attempts exhausted, Slack alert required"
            )

        if policy == EscalationPolicy.ABORT:
            logger.error(
                "ESCALATION [%s]: Aborting after %d attempts",
                scenario.name,
                recipe.max_attempts,
            )
            return RecoveryResult.escalation_required(
                f"{scenario.name}: aborting after {recipe.max_attempts} attempts"
            )

        logger.warning(
            "ESCALATION [%s]: Logging and continuing after %d attempts",
            scenario.name,
            recipe.max_attempts,
        )
        return RecoveryResult.escalation_required(
            f"{scenario.name}: recovery exhausted, logging and continuing"
        )

    @contextmanager
    def with_recovery(
        self,
        scenario: FailureScenario,
    ) -> Generator[None, None, None]:
        try:
            yield
        except Exception as exc:
            logger.warning(
                "Caught exception in %s, attempting recovery: %s",
                scenario.name,
                exc,
            )

            def _retry_step(step: RecoveryStep) -> bool:
                if step.kind == RecoveryStepKind.SKIP_AND_LOG:
                    logger.info(
                        "Skipping %s after failure: %s", scenario.name, exc
                    )
                    return True
                return False

            result = self.attempt_recovery(scenario, _retry_step)

            if result.outcome == RecoveryOutcome.ESCALATION_REQUIRED:
                raise
