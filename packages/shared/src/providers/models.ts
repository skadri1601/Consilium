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
  { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", provider: "openai", free: false, pricing: { inputPerMillion: 0.08, outputPerMillion: 0.30 } },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai", free: false, pricing: { inputPerMillion: 0.20, outputPerMillion: 0.80 } },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "openai", free: false, pricing: { inputPerMillion: 2.00, outputPerMillion: 8.00 } },
  { id: "gpt-5.5", name: "GPT-5.5", provider: "openai", free: false, pricing: { inputPerMillion: 3.00, outputPerMillion: 12.00 } },
  { id: "gpt-5.5-pro", name: "GPT-5.5 Pro", provider: "openai", free: false, pricing: { inputPerMillion: 8.00, outputPerMillion: 32.00 } },

  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic", free: false, pricing: { inputPerMillion: 1.00, outputPerMillion: 5.00 } },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", free: false, pricing: { inputPerMillion: 3.00, outputPerMillion: 15.00 } },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic", free: false, pricing: { inputPerMillion: 5.00, outputPerMillion: 25.00 } },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "anthropic", free: false, pricing: { inputPerMillion: 5.00, outputPerMillion: 25.00 } },

  { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash-Lite", provider: "google", free: false, pricing: { inputPerMillion: 0.05, outputPerMillion: 0.20 } },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "google", free: false, pricing: { inputPerMillion: 0.15, outputPerMillion: 0.60 } },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", provider: "google", free: false, pricing: { inputPerMillion: 1.25, outputPerMillion: 5.00 } },

  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "groq", free: true, pricing: { inputPerMillion: 0.05, outputPerMillion: 0.08 } },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", provider: "groq", free: true, pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 } },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (via Groq)", provider: "groq", free: true, pricing: { inputPerMillion: 0.15, outputPerMillion: 0.60 } },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (via Groq)", provider: "groq", free: true, pricing: { inputPerMillion: 0.05, outputPerMillion: 0.15 } },
  { id: "groq/compound", name: "Groq Compound", provider: "groq", free: false, pricing: { inputPerMillion: 0.80, outputPerMillion: 1.60 } },
  { id: "groq/compound-mini", name: "Groq Compound Mini", provider: "groq", free: false, pricing: { inputPerMillion: 0.30, outputPerMillion: 0.60 } },

  { id: "grok-code-fast-1", name: "Grok Code Fast", provider: "xai", free: false, pricing: { inputPerMillion: 0.30, outputPerMillion: 1.20 } },
  { id: "grok-4-1-fast-non-reasoning", name: "Grok 4.1 Fast (non-reasoning)", provider: "xai", free: false, pricing: { inputPerMillion: 0.50, outputPerMillion: 2.00 } },
  { id: "grok-4-1-fast-reasoning", name: "Grok 4.1 Fast (reasoning)", provider: "xai", free: false, pricing: { inputPerMillion: 1.00, outputPerMillion: 4.00 } },
  { id: "grok-4.20", name: "Grok 4.20", provider: "xai", free: false, pricing: { inputPerMillion: 3.00, outputPerMillion: 15.00 } },

  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "moonshot", free: false, pricing: { inputPerMillion: 1.20, outputPerMillion: 2.50 } },

  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (OpenRouter free)", provider: "openrouter", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B (OpenRouter free)", provider: "openrouter", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B (OpenRouter free)", provider: "openrouter", free: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
];

export const MODEL_BY_ID: Record<string, ModelDefinition> = Object.fromEntries(
  MODELS.map((m) => [m.id, m])
);

export const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  ...Object.fromEntries(MODELS.map((m) => [m.id, m.pricing])),
  default: { inputPerMillion: 1.0, outputPerMillion: 3.0 },
};

export const FREE_MODEL_IDS: string[] = MODELS.filter((m) => m.free).map((m) => m.id);
