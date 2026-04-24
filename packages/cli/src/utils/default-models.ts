export const DEFAULT_MODELS = [
  "gpt-4o-mini",
  "claude-haiku-4-5-20251001",
  "gemini-2.0-flash",
] as const;

export const DEFAULT_BLIND_EVAL_MODELS = [
  "gpt-4o-mini",
  "claude-haiku-4-5-20251001",
] as const;

export interface CatalogEntry {
  id: string;
  provider: "openai" | "anthropic" | "google";
  tier: "fast" | "balanced" | "deep";
}

export const MODEL_CATALOG: readonly CatalogEntry[] = [
  { id: "gpt-4o-mini", provider: "openai", tier: "fast" },
  { id: "gpt-4o", provider: "openai", tier: "balanced" },
  { id: "claude-haiku-4-5-20251001", provider: "anthropic", tier: "fast" },
  { id: "claude-sonnet-4-20250514", provider: "anthropic", tier: "balanced" },
  { id: "gemini-2.0-flash", provider: "google", tier: "fast" },
  { id: "gemini-1.5-pro", provider: "google", tier: "balanced" },
];
