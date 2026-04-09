export type CouncilMode = "quick" | "council" | "deep" | "blind";

export type DebateMode = CouncilMode;

export interface DebateModeConfig {
  rounds: number;
  subAgents: boolean;
  description: string;
  estimatedTime: string;
}

export const DEBATE_MODES: Record<DebateMode, DebateModeConfig> = {
  quick: { rounds: 1, subAgents: false, description: "Single round, fastest response", estimatedTime: "~15s" },
  council: { rounds: 3, subAgents: false, description: "Multi-round deliberation", estimatedTime: "~45s" },
  deep: { rounds: 3, subAgents: true, description: "Multi-round with sub-agent research", estimatedTime: "~90s" },
  blind: { rounds: 3, subAgents: false, description: "Names hidden until scored", estimatedTime: "~45s" },
};

export interface CouncilMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentId?: string;
  timestamp: Date;
}

export interface AgentResponse {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  tokensUsed?: number;
  latencyMs?: number;
  success: boolean;
  error?: string;
}

export interface CouncilQueryRequest {
  query: string;
  agents: string[];
  mode: CouncilMode;
}

export interface CouncilQueryResponse {
  sessionId: string;
  query: string;
  mode: CouncilMode;
  responses: AgentResponse[];
  consensusScore?: number;
  totalAgents: number;
  successfulAgents: number;
}

export interface CouncilSession {
  id: string;
  query: string;
  responses: AgentResponse[];
  consensusScore?: number;
  selectedResponseId?: string;
  mode: CouncilMode;
  createdAt: Date;
}
