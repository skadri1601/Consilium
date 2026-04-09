from __future__ import annotations
from typing import TypedDict, Literal, Optional
from dataclasses import dataclass, field
from enum import Enum

class DeliberationMode(str, Enum):
    QUICK = "quick"
    COUNCIL = "council"
    DEEP = "deep"
    BLIND = "blind"
    REDTEAM = "redteam"
    JURY = "jury"
    MARKET = "market"
    AUTO = "auto"

class ChallengeType(str, Enum):
    FACTUAL_ERROR = "factual_error"
    MISSING_EVIDENCE = "missing_evidence"
    FLAWED_REASONING = "flawed_reasoning"
    BETTER_ALTERNATIVE = "better_alternative"
    EDGE_CASE = "edge_case"
    ASSUMPTION_VIOLATION = "assumption_violation"

class RebuttalType(str, Enum):
    CONCEDE = "concede"
    REFUTE = "refute"
    QUALIFY = "qualify"
    REDIRECT = "redirect"

class AttackCategory(str, Enum):
    LOGICAL_FLAW = "logical_flaw"
    EDGE_CASE = "edge_case"
    SECURITY_VULN = "security_vuln"
    BIAS_DETECTION = "bias_detection"
    HALLUCINATION_PROBE = "hallucination_probe"
    PROMPT_INJECTION = "prompt_injection"
    ROBUSTNESS_TEST = "robustness_test"
    CONSISTENCY_CHECK = "consistency_check"

@dataclass
class Claim:
    id: str
    statement: str
    evidence: list[str]
    confidence: float
    assumptions: list[str]
    limitations: list[str]

@dataclass
class Proposal:
    model_id: str
    content: str
    reasoning_chain: list[str]
    claims: list[Claim]
    raw_confidence: float
    token_count: int = 0
    latency_ms: int = 0
    cost: float = 0.0

@dataclass
class Challenge:
    challenger_id: str
    target_model_id: str
    target_claim_id: str
    challenge_type: ChallengeType
    argument: str
    counter_evidence: list[str]

@dataclass
class Rebuttal:
    defender_id: str
    challenge_id: str
    response_type: RebuttalType
    argument: str
    revised_claim: Optional[Claim] = None

@dataclass
class RubricDimension:
    name: str
    weight: float
    description: str
    scoring_guide: dict[int, str]

@dataclass
class Rubric:
    dimensions: list[RubricDimension]
    def to_prompt(self) -> str:
        lines = []
        for d in self.dimensions:
            guide = ", ".join(f"{k}: {v}" for k, v in sorted(d.scoring_guide.items()))
            lines.append(f"- {d.name} (weight {d.weight}): {d.description} [{guide}]")
        return "\n".join(lines)

@dataclass
class Evaluation:
    evaluator_id: str
    rankings: list[dict]
    ordering_used: list[str]
    rubric_scores: dict[str, dict[str, float]]

@dataclass
class RankedBallot:
    voter_id: str
    ranked_choices: list[str]
    confidence_weight: float = 1.0

@dataclass
class Vote:
    voter_id: str
    ballot: RankedBallot
    reasoning: str

@dataclass
class AggregationResult:
    winner: str
    full_ranking: list[str]
    method: str
    confident: bool
    scores: dict[str, float] = field(default_factory=dict)

@dataclass
class DissentCluster:
    models: list[str]
    position_summary: str
    key_arguments: list[str]
    proposals: list[Proposal]

@dataclass
class DissentReport:
    type: Literal["consensus", "dissent"]
    majority: Optional[DissentCluster] = None
    minority: list[DissentCluster] = field(default_factory=list)
    disagreement_points: list[dict] = field(default_factory=list)

@dataclass
class CalibratedConfidence:
    value: float
    stability_score: float
    concession_rate: float
    method: str = "explanation_stability"

@dataclass
class RoutingDecision:
    mode: str
    models: Optional[int] = None
    model: Optional[str] = None
    reason: str = ""

@dataclass
class CostTracker:
    total_cost: float = 0.0
    per_model: dict[str, float] = field(default_factory=dict)
    per_round: list[float] = field(default_factory=list)
    tokens_in: int = 0
    tokens_out: int = 0

    def record(self, model_id: str, cost: float, tokens_in: int = 0, tokens_out: int = 0):
        self.total_cost += cost
        self.per_model[model_id] = self.per_model.get(model_id, 0.0) + cost
        self.tokens_in += tokens_in
        self.tokens_out += tokens_out

@dataclass
class AuditEntry:
    step: str
    model_id: str
    input_summary: str
    output_summary: str
    latency_ms: int
    tokens_in: int
    tokens_out: int
    cost: float
    round_number: int
    timestamp: str

@dataclass
class ConvergenceResult:
    converged: bool
    score: float
    components: dict[str, float] = field(default_factory=dict)
    recommendation: str = ""

@dataclass
class MarketPosition:
    model_id: str
    distribution: dict[str, float]
    round_number: int

@dataclass
class MarketResult:
    consensus_distribution: dict[str, float]
    convergence_round: int
    position_history: list[list[MarketPosition]]
    confidence: float

@dataclass
class RedTeamAttack:
    attacker_id: str
    category: AttackCategory
    attack_content: str
    severity: Literal["low", "medium", "high", "critical"]

@dataclass
class RedTeamDefense:
    defender_id: str
    attack_index: int
    defense_content: str
    mitigated: bool

@dataclass
class RedTeamJudgment:
    judge_id: str
    attack_index: int
    valid_attack: bool
    effective_defense: bool
    severity_confirmed: Literal["low", "medium", "high", "critical"]
    reasoning: str

@dataclass
class RedTeamReport:
    attacks: list[RedTeamAttack]
    defenses: list[dict]
    judgments: list[dict]
    vulnerability_count: dict[str, int]
    overall_score: float

DeliberationCostTracker = CostTracker

class DeliberationState(TypedDict):
    topic: str
    mode: str
    round_number: int
    max_rounds: int
    models: list[str]
    judge_model: str
    proposals: list[dict]
    challenges: list[dict]
    rebuttals: list[dict]
    evaluations: list[dict]
    votes: list[dict]
    aggregation_result: Optional[dict]
    convergence_result: Optional[dict]
    dissent_report: Optional[dict]
    confidence_scores: dict[str, float]
    audit_trail: list[dict]
    cost_tracker: dict
    golden_prompt: Optional[str]
    red_team_report: Optional[dict]
    market_result: Optional[dict]

DEFAULT_RUBRIC = Rubric(dimensions=[
    RubricDimension("correctness", 0.30, "Factual accuracy and logical validity",
                    {1: "Major errors", 5: "Mostly correct", 10: "Flawless"}),
    RubricDimension("completeness", 0.20, "Covers all aspects",
                    {1: "Misses key points", 5: "Adequate", 10: "Comprehensive"}),
    RubricDimension("reasoning_quality", 0.25, "Depth and rigor of reasoning",
                    {1: "No reasoning", 5: "Basic", 10: "Rigorous multi-step"}),
    RubricDimension("actionability", 0.15, "Practical applicability",
                    {1: "Abstract only", 5: "Some actionable", 10: "Immediately usable"}),
    RubricDimension("conciseness", 0.10, "Information density",
                    {1: "Extreme padding", 5: "Reasonable", 10: "Zero waste"}),
])
