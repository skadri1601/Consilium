import type { Provider } from "./provider";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: Provider;
  free: boolean;
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
  };
}

export const MODELS: ModelDefinition[] = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", free: false, pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 } },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", free: false, pricing: { inputPerMillion: 2.5, outputPerMillion: 10 } },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", free: false, pricing: { inputPerMillion: 2.0, outputPerMillion: 8 } },
  { id: "o3-mini", name: "o3-mini", provider: "openai", free: false, pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 } },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic", free: false, pricing: { inputPerMillion: 0.8, outputPerMillion: 4 } },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic", free: false, pricing: { inputPerMillion: 3, outputPerMillion: 15 } },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "anthropic", free: false, pricing: { inputPerMillion: 15, outputPerMillion: 75 } },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", free: false, pricing: { inputPerMillion: 1.25, outputPerMillion: 10 } },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "grok-2", name: "Grok 2", provider: "xai", free: false, pricing: { inputPerMillion: 2, outputPerMillion: 10 } },
  { id: "grok-2-mini", name: "Grok 2 Mini", provider: "xai", free: false, pricing: { inputPerMillion: 0.3, outputPerMillion: 1 } },
  { id: "llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", provider: "groq", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
];

export const MODEL_BY_ID: Record<string, ModelDefinition> = Object.fromEntries(
  MODELS.map((m) => [m.id, m])
);

export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  ...Object.fromEntries(MODELS.map((m) => [m.id, m.pricing])),
  default: { inputPerMillion: 1.0, outputPerMillion: 3.0 },
};

export const FREE_MODEL_IDS: string[] = MODELS.filter((m) => m.free).map((m) => m.id);
