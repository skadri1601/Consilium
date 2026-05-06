export const DEBATE_EVENT_NAMES = [
  "debate_start",
  "debate_cancelled",
  "round_start",
  "round_complete",
  "agent_start",
  "agent_chunk",
  "agent_complete",
  "convergence_detected",
  "judge_start",
  "judge_retry",
  "consensus",
  "cost_update",
  "done",
  "error",
  "anti_capitulation",
  "anti_capitulation_revised",
  "subagent_research_start",
  "subagent_research_done",
  "session_compacted",
  "recovery_attempted",
  "failure_classified",
  "routing:fallback",
] as const;

export type SseEventType = (typeof DEBATE_EVENT_NAMES)[number];

export interface DebateStartEvent {
  event: "debate_start";
  debate_id: string;
  topic: string;
  models: string[];
  round_count: number;
  sub_agents?: boolean;
  started_at?: string;
  resumed_from_round?: number | null;
}

export interface RoundStartEvent {
  event: "round_start";
  round: number;
  description: string;
}

export interface RoundCompleteEvent {
  event: "round_complete";
  round: number;
  responses: Array<{ label: string; model_id: string; text: string }>;
}

export interface AgentStartEvent {
  event: "agent_start";
  agent_id: string;
  round: number;
}

export interface AgentChunkEvent {
  event: "agent_chunk";
  agent_id: string;
  chunk: string;
}

export interface AgentCompleteEvent {
  event: "agent_complete";
  agent_id: string;
  round: number;
  content: string;
}

export interface ConvergenceDetectedEvent {
  event: "convergence_detected";
  similarity: number;
  skippingRounds: boolean;
  pairwise: Array<{ model_a: string; model_b: string; similarity: number }>;
}

export interface JudgeStartEvent {
  event: "judge_start";
  description: string;
}

export interface JudgeRetryEvent {
  event: "judge_retry";
  debate_id: string;
  reason: string;
  error_type: string;
  error_detail?: string;
}

export interface ConsensusEvent {
  event: "consensus";
  golden_prompt: string;
  goldenPrompt?: string;
  judge_model: string;
}

export interface CostUpdateEvent {
  event: "cost_update";
  total_cost: number;
  total_tokens: number;
  breakdown?: Record<string, unknown>;
}

export interface DoneEvent {
  event: "done";
  status: string;
  debate_id: string;
  total_cost?: number;
  total_tokens?: number;
  duration_ms?: number;
  models_succeeded?: string[];
  models_failed?: string[];
  completed_at?: string;
}

export interface DebateErrorEvent {
  event: "error";
  message: string;
  recoverable: boolean;
}

export interface DebateCancelledEvent {
  event: "debate_cancelled";
  debate_id: string;
  reason: string;
  partial_cost?: number;
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

export interface SubagentResearchStartEvent {
  event: "subagent_research_start";
  models: string[];
}

export interface SubagentResearchDoneEvent {
  event: "subagent_research_done";
  count: number;
  total_tasks: number;
}

export interface SessionCompactedEvent {
  event: "session_compacted";
  original_tokens: number;
  compacted_tokens: number;
  reduction_pct: number;
}

export interface RecoveryAttemptedEvent {
  event: "recovery_attempted";
  failure_class: string;
  provider: string | null;
  success: boolean;
}

export interface FailureClassifiedEvent {
  event: "failure_classified";
  failure_class: string;
  provider: string | null;
  detail: string;
  recoverable: boolean;
}

export interface RoutingFallbackEvent {
  event: "routing:fallback";
  original_model: string;
  fallback_model: string;
  reason: string;
}

export type DebateSseEvent =
  | DebateStartEvent
  | RoundStartEvent
  | RoundCompleteEvent
  | AgentStartEvent
  | AgentChunkEvent
  | AgentCompleteEvent
  | ConvergenceDetectedEvent
  | JudgeStartEvent
  | JudgeRetryEvent
  | ConsensusEvent
  | CostUpdateEvent
  | DoneEvent
  | DebateErrorEvent
  | DebateCancelledEvent
  | AntiCapitulationEvent
  | AntiCapitulationRevisedEvent
  | SubagentResearchStartEvent
  | SubagentResearchDoneEvent
  | SessionCompactedEvent
  | RecoveryAttemptedEvent
  | FailureClassifiedEvent
  | RoutingFallbackEvent;
