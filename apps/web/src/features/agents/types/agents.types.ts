export type AgentProvider = "OpenAI" | "Anthropic" | "Google" | "Groq" | "XAI";

export interface AgentDef {
  id: string;
  name: string;
  provider: AgentProvider;
  description: string;
  free: boolean;
}
