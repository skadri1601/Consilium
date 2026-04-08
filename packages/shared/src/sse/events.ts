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

export interface ConvergenceDetectedEvent {
  event: "convergence_detected";
  similarity: number;
  skippingRounds: boolean;
  pairwise: Array<{ model_a: string; model_b: string; similarity: number }>;
}

export interface JudgeStartEvent {
  event: "judge_start";
  judgeModel?: string;
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

export interface DoneEvent {
  event: "done";
  status: string;
}

export interface ErrorEvent {
  event: "error";
  message: string;
  recoverable: boolean;
}

export interface DebateCancelledEvent {
  event: "debate:cancelled";
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
  | ConsensusEvent
  | CostUpdateEvent
  | DoneEvent
  | ErrorEvent
  | DebateCancelledEvent;

export type SseEventType = DebateSseEvent["event"];
