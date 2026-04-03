export interface Agent {
  id: string;
  name: string;
  provider: string;
  modelId?: string;
  description?: string;
}

export interface AgentResponse {
  agentId: string;
  content: string;
  cost?: number;
  latencyMs?: number;
}
