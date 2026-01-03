export type CouncilMode = "blind" | "visible";

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
