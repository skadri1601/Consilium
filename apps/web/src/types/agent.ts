export interface Agent {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "xai";
  modelId: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentResponse {
  agentId: string;
  content: string;
  tokensUsed: number;
  latencyMs: number;
  timestamp: Date;
}

export type AgentProvider = Agent["provider"];
