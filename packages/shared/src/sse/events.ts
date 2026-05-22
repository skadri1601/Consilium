/**
 * Canonical SSE event schema for the debate stream.
 *
 * Every event the agents service emits is enumerated here. The
 * Python source of truth lives at
 * `apps/agents/src/core/sse_events.py` - the two MUST stay in sync.
 * `SseEventName` below is the single string-literal union both sides
 * agree on.
 */

export const SSE_EVENT_NAMES = [
  "debate_start",
  "round_start",
  "round_complete",
  "agent_start",
  "agent_chunk",
  "agent_complete",
  "subagent_research_start",
  "subagent_research_done",
  "convergence_detected",
  "compaction_applied",
  "session_compacted",
  "anti_capitulation",
  "anti_capitulation_revised",
  "judge_start",
  "judge_retry",
  "judge:attempt",
  "judge:chunk",
  "judge:complete",
  "judge:cross-ref",
  "judge:disputes",
  "judge:error",
  "judge:extracting",
  "judge:fallback",
  "judge:fatal",
  "judge:scoring",
  "judge:scoring_complete",
  "judge:synthesizing",
  "phase_start",
  "phase_end",
  "consensus",
  "cost_update",
  "routing:decided",
  "routing:applied",
  "routing:fallback",
  "recovery:applied",
  "done",
  "error",
  "debate:cancelled",
  "tool:call_start",
  "tool:call_result",
  "tool:loop_start",
  "tool:loop_done",
  "governance:policy_check",
  "governance:approval_requested",
  "governance:decision",
  "risk:scoring_start",
  "risk:scoring_complete",
  "audit:exported",
] as const;

export type SseEventName = (typeof SSE_EVENT_NAMES)[number];

export interface DebateStartEvent {
  event: "debate_start";
  debate_id: string;
  topic: string;
  models: string[];
  round_count: number;
}

export interface RoundStartEvent {
  event: "round_start";
  round: number;
  description: string;
}

export interface RoundCompleteEvent {
  event: "round_complete";
  round: number;
  responses: Record<string, unknown>;
}

export interface AgentStartEvent {
  event: "agent_start";
  agentId: string;
  roundNumber: number;
}

export interface AgentChunkEvent {
  event: "agent_chunk";
  agentId: string;
  chunk: string;
}

export interface AgentCompleteEvent {
  event: "agent_complete";
  agentId: string;
  tokens: number;
  cost: number;
  durationMs: number;
}

export interface SubagentResearchStartEvent {
  event: "subagent_research_start";
  models: string[];
}

export interface SubagentResearchDoneEvent {
  event: "subagent_research_done";
  count: number;
}

export interface ConvergenceDetectedEvent {
  event: "convergence_detected";
  similarity: number;
  skippingRounds: boolean;
  pairwise: Array<{ model_a: string; model_b: string; similarity: number }>;
}

export interface CompactionAppliedEvent {
  event: "compaction_applied";
  droppedRounds: number[];
  keptRounds: number[];
  charsBefore: number;
  charsAfter: number;
  ratio: number;
}

export interface SessionCompactedEvent {
  event: "session_compacted";
  original_tokens: number;
  compacted_tokens: number;
  reduction_pct: number;
}

export interface AntiCapitulationEvent {
  event: "anti_capitulation";
  agent_id: string;
  r1_claims: number;
  r3_claims: number;
  drop_ratio: number;
}

export interface AntiCapitulationRevisedEvent {
  event: "anti_capitulation_revised";
  agent_id: string;
  cost: number;
}

export interface JudgeStartEvent {
  event: "judge_start";
  judgeModel?: string;
  description?: string;
}

export interface JudgeRetryEvent {
  event: "judge_retry";
  attempt: number;
  reason?: string;
}

export interface JudgePhaseEvent {
  event:
    | "judge:attempt"
    | "judge:chunk"
    | "judge:complete"
    | "judge:cross-ref"
    | "judge:disputes"
    | "judge:error"
    | "judge:extracting"
    | "judge:fallback"
    | "judge:fatal"
    | "judge:scoring"
    | "judge:scoring_complete"
    | "judge:synthesizing";
  [key: string]: unknown;
}

export interface PhaseStartEvent {
  event: "phase_start";
  phase: string;
}

export interface PhaseEndEvent {
  event: "phase_end";
  phase: string;
}

export interface ConsensusEvent {
  event: "consensus";
  goldenPrompt: string;
  totalCost: number;
  modelsUsed: string[];
}

export interface CostUpdateEvent {
  event: "cost_update";
  totalCost: number;
}

export interface RoutingDecidedEvent {
  event: "routing:decided";
  modelId: string;
  effectiveModel: string;
  effectiveProvider: string;
}

export interface RoutingFallbackEvent {
  event: "routing:fallback";
  requestedModel: string;
  effectiveModel: string;
  reason: string;
}

export interface RecoveryAppliedEvent {
  event: "recovery:applied";
  participantId: string;
  failureClass: string;
  action: string;
  attempt: number;
}

export interface DoneEvent {
  event: "done";
  status: string;
  totalCost: number;
  totalTokens: number;
  goldenPrompt: string;
}

export interface DebateErrorEvent {
  event: "error";
  message: string;
  recoverable: boolean;
}

export interface DebateCancelledEvent {
  event: "debate:cancelled";
  reason: string;
}

export interface RoutingAppliedEvent {
  event: "routing:applied";
  strategy: string;
  models: string[];
  complexity: number;
}

export interface ToolCallStartEvent {
  event: "tool:call_start";
  tool: string;
  call_id: string;
  agent_id?: string;
  arguments?: Record<string, unknown>;
}

export interface ToolCallResultEvent {
  event: "tool:call_result";
  tool: string;
  call_id: string;
  is_error: boolean;
  content_preview?: string;
  duration_ms?: number;
}

export interface ToolLoopStartEvent {
  event: "tool:loop_start";
  tools: string[];
}

export interface ToolLoopDoneEvent {
  event: "tool:loop_done";
  call_count: number;
  error_count: number;
}

export interface GovernancePolicyCheckEvent {
  event: "governance:policy_check";
  policy_id: string;
  matched: boolean;
  decision: string;
}

export interface GovernanceApprovalRequestedEvent {
  event: "governance:approval_requested";
  request_id: string;
  reason: string;
  required_approvers?: number;
}

export interface GovernanceDecisionEvent {
  event: "governance:decision";
  request_id?: string;
  approved: boolean;
  reason: string;
  matching_rule?: string;
}

export interface RiskScoringStartEvent {
  event: "risk:scoring_start";
  proposal_preview?: string;
  models?: string[];
}

export interface RiskScoringCompleteEvent {
  event: "risk:scoring_complete";
  risk_score: number;
  severity: string;
  vulnerability_count: number;
  duration_ms: number;
}

export interface AuditExportedEvent {
  event: "audit:exported";
  debate_id: string;
  audit_trail_id?: string;
  byte_size?: number;
}

export type DebateSseEvent =
  | DebateStartEvent
  | RoundStartEvent
  | RoundCompleteEvent
  | AgentStartEvent
  | AgentChunkEvent
  | AgentCompleteEvent
  | SubagentResearchStartEvent
  | SubagentResearchDoneEvent
  | ConvergenceDetectedEvent
  | CompactionAppliedEvent
  | SessionCompactedEvent
  | AntiCapitulationEvent
  | AntiCapitulationRevisedEvent
  | JudgeStartEvent
  | JudgeRetryEvent
  | JudgePhaseEvent
  | PhaseStartEvent
  | PhaseEndEvent
  | ConsensusEvent
  | CostUpdateEvent
  | RoutingDecidedEvent
  | RoutingAppliedEvent
  | RoutingFallbackEvent
  | RecoveryAppliedEvent
  | DoneEvent
  | DebateErrorEvent
  | DebateCancelledEvent
  | ToolCallStartEvent
  | ToolCallResultEvent
  | ToolLoopStartEvent
  | ToolLoopDoneEvent
  | GovernancePolicyCheckEvent
  | GovernanceApprovalRequestedEvent
  | GovernanceDecisionEvent
  | RiskScoringStartEvent
  | RiskScoringCompleteEvent
  | AuditExportedEvent;

/**
 * Backwards-compatible alias of the discriminator field.
 *
 * Prefer ``SseEventName`` (covers every name in ``SSE_EVENT_NAMES``,
 * including event types that do not yet have a dedicated payload
 * interface). ``SseEventType`` is the older alias kept for callers that
 * narrow on a typed payload.
 */
export type SseEventType = DebateSseEvent["event"];

export function isSseEventName(value: string): value is SseEventName {
  return (SSE_EVENT_NAMES as readonly string[]).includes(value);
}
