export type AgentProvider =
  | "OpenAI"
  | "Anthropic"
  | "Google"
  | "Groq"
  | "xAI"
  | "Moonshot"
  | "OpenRouter";

export interface AgentDef {
  id: string;
  name: string;
  provider: AgentProvider;
  description: string;
  free: boolean;
}

export interface Agent {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAgentInput {
  name: string;
  provider: string;
  modelId: string;
  description?: string;
}
