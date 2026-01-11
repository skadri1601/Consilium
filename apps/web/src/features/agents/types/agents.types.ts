export type AgentProvider = "openai" | "anthropic" | "google" | "groq" | "xai";

export interface Agent {
  id: string;
  name: string;
  provider: AgentProvider;
  modelId: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentInput {
  name: string;
  provider: string;
  modelId: string;
  description?: string;
}
