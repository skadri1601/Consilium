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
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "openai",
    free: false,
    pricing: { inputPerMillion: 0.08, outputPerMillion: 0.3 },
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "openai",
    free: false,
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.8 },
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    free: false,
    pricing: { inputPerMillion: 2.0, outputPerMillion: 8.0 },
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "openai",
    free: false,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 12.0 },
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    provider: "openai",
    free: false,
    pricing: { inputPerMillion: 8.0, outputPerMillion: 32.0 },
  },

  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    free: false,
    pricing: { inputPerMillion: 1.0, outputPerMillion: 5.0 },
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    free: false,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "anthropic",
    free: false,
    pricing: { inputPerMillion: 5.0, outputPerMillion: 25.0 },
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    free: false,
    pricing: { inputPerMillion: 5.0, outputPerMillion: 25.0 },
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    free: false,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  },

  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    free: false,
    pricing: { inputPerMillion: 0.05, outputPerMillion: 0.2 },
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    free: false,
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    free: false,
    pricing: { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  },

  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    free: true,
    pricing: { inputPerMillion: 0.05, outputPerMillion: 0.08 },
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "groq",
    free: true,
    pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B (via Groq)",
    provider: "groq",
    free: true,
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B (via Groq)",
    provider: "groq",
    free: true,
    pricing: { inputPerMillion: 0.05, outputPerMillion: 0.15 },
  },
  {
    id: "groq/compound",
    name: "Groq Compound",
    provider: "groq",
    free: false,
    pricing: { inputPerMillion: 0.8, outputPerMillion: 1.6 },
  },
  {
    id: "groq/compound-mini",
    name: "Groq Compound Mini",
    provider: "groq",
    free: false,
    pricing: { inputPerMillion: 0.3, outputPerMillion: 0.6 },
  },

  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast",
    provider: "xai",
    free: false,
    pricing: { inputPerMillion: 0.3, outputPerMillion: 1.2 },
  },
  {
    id: "grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast (non-reasoning)",
    provider: "xai",
    free: false,
    pricing: { inputPerMillion: 0.5, outputPerMillion: 2.0 },
  },
  {
    id: "grok-4-1-fast-reasoning",
    name: "Grok 4.1 Fast (reasoning)",
    provider: "xai",
    free: false,
    pricing: { inputPerMillion: 1.0, outputPerMillion: 4.0 },
  },
  {
    id: "grok-4.20",
    name: "Grok 4.20",
    provider: "xai",
    free: false,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  },
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    provider: "xai",
    free: false,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  },

  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    provider: "moonshot",
    free: false,
    pricing: { inputPerMillion: 1.2, outputPerMillion: 2.5 },
  },
  {
    id: "kimi-k2.5",
    name: "Kimi K2.5",
    provider: "moonshot",
    free: false,
    pricing: { inputPerMillion: 0.8, outputPerMillion: 1.8 },
  },
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "moonshot",
    free: false,
    pricing: { inputPerMillion: 1.2, outputPerMillion: 2.5 },
  },

  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B (OpenRouter free)",
    provider: "openrouter",
    free: true,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B (OpenRouter free)",
    provider: "openrouter",
    free: true,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    id: "cohere/north-mini-code:free",
    name: "North Mini Code (OpenRouter free)",
    provider: "openrouter",
    free: true,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super 120B (OpenRouter free)",
    provider: "openrouter",
    free: true,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    id: "inclusionai/ling-3.0-flash-fin:free",
    name: "Ling 3.0 Flash (OpenRouter free)",
    provider: "openrouter",
    free: true,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
];

export const MODEL_BY_ID: Record<string, ModelDefinition> = Object.fromEntries(
  MODELS.map((m) => [m.id, m]),
);

export const MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  ...Object.fromEntries(MODELS.map((m) => [m.id, m.pricing])),
  default: { inputPerMillion: 1.0, outputPerMillion: 3.0 },
};

export const FREE_MODEL_IDS: string[] = MODELS.filter((m) => m.free).map(
  (m) => m.id,
);
