export const DEFAULT_MODELS = [
  "gpt-5.4-mini",
  "claude-haiku-4-5-20251001",
  "gemini-3.1-pro-preview",
] as const;

export const DEFAULT_BLIND_EVAL_MODELS = [
  "gpt-5.4-mini",
  "claude-haiku-4-5-20251001",
] as const;

export interface CatalogEntry {
  id: string;
  provider: "openai" | "anthropic" | "google" | "groq" | "xai" | "moonshot" | "openrouter";
  tier: "fast" | "balanced" | "deep";
  status: "current" | "preview" | "deprecated" | "retired";
  notes?: string;
}

export const MODEL_CATALOG: readonly CatalogEntry[] = [
  { id: "gpt-5.5-pro", provider: "openai", tier: "deep", status: "current" },
  { id: "gpt-5.5", provider: "openai", tier: "balanced", status: "current" },
  { id: "gpt-5.4", provider: "openai", tier: "balanced", status: "current" },
  { id: "gpt-5.4-mini", provider: "openai", tier: "fast", status: "current" },
  { id: "gpt-5.4-nano", provider: "openai", tier: "fast", status: "current" },
  { id: "gpt-4o", provider: "openai", tier: "balanced", status: "deprecated", notes: "legacy in 2026; migrate to gpt-5.4" },
  { id: "gpt-4o-mini", provider: "openai", tier: "fast", status: "deprecated", notes: "legacy in 2026; migrate to gpt-5.4-mini" },

  { id: "claude-opus-4-7", provider: "anthropic", tier: "deep", status: "current", notes: "platform default since 2026-04-23" },
  { id: "claude-opus-4-6", provider: "anthropic", tier: "deep", status: "current" },
  { id: "claude-sonnet-4-6", provider: "anthropic", tier: "balanced", status: "current" },
  { id: "claude-haiku-4-5-20251001", provider: "anthropic", tier: "fast", status: "current" },
  { id: "claude-sonnet-4-20250514", provider: "anthropic", tier: "balanced", status: "deprecated", notes: "retiring 2026-06-15; migrate to claude-sonnet-4-6" },

  { id: "gemini-3.1-pro-preview", provider: "google", tier: "deep", status: "preview", notes: "current main text model" },
  { id: "gemini-3-flash-preview", provider: "google", tier: "fast", status: "preview" },
  { id: "gemini-2.0-flash", provider: "google", tier: "fast", status: "deprecated", notes: "shutdown 2026-06-01" },
  { id: "gemini-1.5-pro", provider: "google", tier: "balanced", status: "retired", notes: "404 on Gemini API" },

  { id: "llama-3.3-70b-versatile", provider: "groq", tier: "balanced", status: "current" },
  { id: "llama-3.1-8b-instant", provider: "groq", tier: "fast", status: "current" },
  { id: "openai/gpt-oss-120b", provider: "groq", tier: "deep", status: "current" },
  { id: "openai/gpt-oss-20b", provider: "groq", tier: "balanced", status: "current" },
  { id: "groq/compound", provider: "groq", tier: "deep", status: "current", notes: "agentic system with web search + code exec" },
  { id: "groq/compound-mini", provider: "groq", tier: "balanced", status: "current" },

  { id: "grok-4.20", provider: "xai", tier: "deep", status: "current", notes: "xAI's stated recommended default" },
  { id: "grok-4-1-fast-reasoning", provider: "xai", tier: "fast", status: "current" },
  { id: "grok-4-1-fast-non-reasoning", provider: "xai", tier: "fast", status: "current" },
  { id: "grok-code-fast-1", provider: "xai", tier: "fast", status: "current", notes: "agentic coding" },
  { id: "grok-beta", provider: "xai", tier: "balanced", status: "deprecated", notes: "legacy" },

  { id: "kimi-k2.6", provider: "moonshot", tier: "deep", status: "current", notes: "256K ctx, tool-use (OpenAI-compatible)" },
  { id: "kimi-k2.5", provider: "moonshot", tier: "balanced", status: "current" },
  { id: "moonshotai/Kimi-K2-Instruct", provider: "moonshot", tier: "balanced", status: "current", notes: "open-weights variant" },

  { id: "meta-llama/llama-3.3-70b-instruct:free", provider: "openrouter", tier: "balanced", status: "current", notes: "free tier via OpenRouter community pool" },
  { id: "google/gemini-flash-1.5:free", provider: "openrouter", tier: "fast", status: "current", notes: "free tier" },
  { id: "mistralai/mistral-7b-instruct:free", provider: "openrouter", tier: "fast", status: "current", notes: "free tier" },
  { id: "nvidia/nemotron-4-340b-instruct:free", provider: "openrouter", tier: "deep", status: "current", notes: "free tier" },
];

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return MODEL_CATALOG.find((entry) => entry.id === id);
}

export function isDeprecatedOrRetired(id: string): boolean {
  const entry = findCatalogEntry(id);
  return entry?.status === "deprecated" || entry?.status === "retired";
}
