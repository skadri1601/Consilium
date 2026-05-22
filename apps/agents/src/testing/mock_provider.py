from __future__ import annotations

import hashlib
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Optional, Tuple

from ..features.agents.base_agent import BaseAgent


@dataclass
class ScriptedResponse:
    content: str
    tokens: int = 150
    latency_ms: int = 0
    raise_error: Exception | None = None


@dataclass
class MockScenario:
    name: str
    responses: dict[str, list[ScriptedResponse]] = field(default_factory=dict)
    default_response: ScriptedResponse | None = None

    def add_model_responses(self, model_id: str, responses: list[ScriptedResponse]):
        self.responses[model_id] = responses

    def get_response(self, model_id: str, call_index: int) -> ScriptedResponse:
        model_responses = self.responses.get(model_id, [])
        if model_responses:
            idx = min(call_index, len(model_responses) - 1)
            return model_responses[idx]
        if self.default_response:
            return self.default_response
        return ScriptedResponse(
            content=f"Mock response from {model_id} (call #{call_index + 1}): "
            f"This is a deterministic test response with substantive content "
            f"that meets the minimum length requirement for validation.",
        )


class MockAgent(BaseAgent):

    def __init__(
        self,
        model_id: str,
        scenario: MockScenario | None = None,
        *,
        fail_health: bool = False,
    ):
        super().__init__(
            name=f"Mock-{model_id}",
            provider="mock",
            model=model_id,
            api_key_env_var="MOCK_API_KEY",
        )
        self.model_id = model_id
        self.api_key = "mock-key-for-testing"
        self.scenario = scenario
        self._call_count = 0
        self._call_log: list[dict] = []
        self._fail_health = fail_health

    async def generate_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> Tuple[str, int]:
        scripted = self._get_scripted()
        self._call_log.append({
            "call_index": self._call_count - 1,
            "query_hash": hashlib.sha256(query.encode()).hexdigest()[:12],
            "system_prompt_prefix": (system_prompt or "")[:80],
            "reasoning_effort": reasoning_effort,
        })
        if scripted.raise_error:
            raise scripted.raise_error
        return scripted.content, scripted.tokens

    async def stream_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> AsyncIterator[str]:
        scripted = self._get_scripted()
        if scripted.raise_error:
            raise scripted.raise_error
        words = scripted.content.split()
        for i in range(0, len(words), 3):
            yield " ".join(words[i : i + 3]) + " "

    async def health_check(self) -> bool:
        return not self._fail_health

    def _get_scripted(self) -> ScriptedResponse:
        idx = self._call_count
        self._call_count += 1
        if self.scenario:
            return self.scenario.get_response(self.model_id, idx)
        return ScriptedResponse(
            content=f"Mock response from {self.model_id} (call #{idx + 1}): "
            f"This is a deterministic test response with substantive content "
            f"that meets the minimum length requirement for validation.",
        )

    @property
    def call_count(self) -> int:
        return self._call_count

    @property
    def call_log(self) -> list[dict]:
        return list(self._call_log)

    def reset(self):
        self._call_count = 0
        self._call_log.clear()


class MockAgentFactory:

    def __init__(self, scenario: MockScenario | None = None):
        self.scenario = scenario
        self._agents: dict[str, MockAgent] = {}

    def create(
        self,
        model_id: str,
        api_keys: dict[str, str | None] | None = None,
        **kwargs,
    ) -> MockAgent:
        if model_id not in self._agents:
            self._agents[model_id] = MockAgent(model_id, self.scenario)
        return self._agents[model_id]

    def get_agent(self, model_id: str) -> MockAgent | None:
        return self._agents.get(model_id)

    def all_agents(self) -> dict[str, MockAgent]:
        return dict(self._agents)

    def total_calls(self) -> int:
        return sum(a.call_count for a in self._agents.values())

    def reset_all(self):
        for agent in self._agents.values():
            agent.reset()


SCENARIO_CONSENSUS = MockScenario(
    name="consensus",
    default_response=ScriptedResponse(
        content=(
            "After careful analysis, I believe the answer involves these key points:\n"
            "- Point 1: The primary consideration is efficiency and maintainability\n"
            "- Point 2: Security must be balanced with usability\n"
            "- Point 3: Testing coverage should be comprehensive\n"
            "[Confidence: High]\n"
            "This approach aligns with industry best practices and addresses "
            "the core requirements while maintaining flexibility for future changes."
        ),
        tokens=200,
    ),
)

SCENARIO_DISAGREEMENT = MockScenario(name="disagreement")
SCENARIO_DISAGREEMENT.add_model_responses("model-alpha", [
    ScriptedResponse(
        content=(
            "I strongly advocate for approach A:\n"
            "- Microservices architecture provides better scalability\n"
            "- Independent deployment reduces risk\n"
            "- Team autonomy is maximized\n"
            "- Failure isolation is superior\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(
        content=(
            "While Model B raises valid points about complexity, the benefits "
            "of microservices outweigh the costs:\n"
            "- Operational overhead is manageable with modern tooling\n"
            "- The scalability benefits are proven at scale\n"
            "- Team velocity increases long-term\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(
        content=(
            "After considering all perspectives, I maintain my position:\n"
            "- Microservices remain the better choice for this use case\n"
            "- However, I concede that a phased migration approach reduces risk\n"
            "- Starting with a modular monolith and extracting services makes sense\n"
            "[Confidence: Medium-High]"
        ),
    ),
])
SCENARIO_DISAGREEMENT.add_model_responses("model-beta", [
    ScriptedResponse(
        content=(
            "I argue for approach B:\n"
            "- Monolithic architecture is simpler to develop and deploy\n"
            "- Reduces operational complexity significantly\n"
            "- Better for small-to-medium teams\n"
            "- Easier debugging and testing\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(
        content=(
            "Model A's microservices argument ignores practical realities:\n"
            "- The team size doesn't justify the operational overhead\n"
            "- Network latency between services adds real cost\n"
            "- Debugging distributed systems is fundamentally harder\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(
        content=(
            "Final assessment considering both perspectives:\n"
            "- A modular monolith offers the best of both approaches\n"
            "- Clear module boundaries prepare for future extraction\n"
            "- Operational simplicity is preserved initially\n"
            "[Confidence: High]"
        ),
    ),
])

SCENARIO_FAILURE = MockScenario(name="partial_failure")
SCENARIO_FAILURE.add_model_responses("model-reliable", [
    ScriptedResponse(
        content=(
            "Detailed analysis with multiple supporting points:\n"
            "- The data shows clear patterns supporting this conclusion\n"
            "- Historical precedent confirms the expected outcome\n"
            "- Risk factors have been identified and mitigated\n"
            "[Confidence: High]"
        ),
    ),
])
SCENARIO_FAILURE.add_model_responses("model-flaky", [
    ScriptedResponse(
        content="",
        raise_error=TimeoutError("Mock timeout for testing"),
    ),
    ScriptedResponse(
        content=(
            "Recovery response after initial failure:\n"
            "- System has recovered and can provide analysis\n"
            "- Key findings align with previous assessments\n"
            "- Additional context improves confidence\n"
            "[Confidence: Medium]"
        ),
    ),
])

SCENARIO_CAPITULATION = MockScenario(name="capitulation")
SCENARIO_CAPITULATION.add_model_responses("model-firm", [
    ScriptedResponse(
        content=(
            "My position is clear and well-supported:\n"
            "- Claim 1: Static typing prevents entire categories of bugs\n"
            "- Claim 2: IDE support is dramatically better\n"
            "- Claim 3: Refactoring is safer with types\n"
            "- Claim 4: Documentation is implicit in type signatures\n"
            "- Claim 5: Performance can be optimized by the compiler\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(content="Round 2 response maintaining all positions with evidence."),
    ScriptedResponse(
        content=(
            "After review, I maintain all original claims:\n"
            "- Claim 1: Static typing prevents bugs (maintained)\n"
            "- Claim 2: IDE support (maintained)\n"
            "- Claim 3: Refactoring safety (maintained)\n"
            "- Claim 4: Documentation (maintained)\n"
            "- Claim 5: Performance (maintained)\n"
            "[Confidence: High]"
        ),
    ),
])
SCENARIO_CAPITULATION.add_model_responses("model-capitulator", [
    ScriptedResponse(
        content=(
            "Strong position on dynamic typing:\n"
            "- Claim 1: Development speed is higher\n"
            "- Claim 2: Prototyping is faster\n"
            "- Claim 3: Less boilerplate code\n"
            "- Claim 4: More flexible APIs\n"
            "- Claim 5: Easier onboarding for new developers\n"
            "[Confidence: High]"
        ),
    ),
    ScriptedResponse(content="Round 2 maintaining positions."),
    ScriptedResponse(
        content=(
            "After reviewing the critiques, I now agree with the other side.\n"
            "[Confidence: Low]"
        ),
    ),
])

BUILTIN_SCENARIOS: dict[str, MockScenario] = {
    "consensus": SCENARIO_CONSENSUS,
    "disagreement": SCENARIO_DISAGREEMENT,
    "partial_failure": SCENARIO_FAILURE,
    "capitulation": SCENARIO_CAPITULATION,
}
