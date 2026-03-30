export const FREE_FALLBACK_MODELS = {
  debater: "llama-3.1-8b-instant",
  judge: "llama-3.3-70b-versatile",
};

export const MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4.1": { inputPerMillion: 2.0, outputPerMillion: 8.0 },
  "o3-mini": { inputPerMillion: 1.1, outputPerMillion: 4.4 },
  "claude-haiku-4-5": { inputPerMillion: 0.8, outputPerMillion: 4.0 },
  "claude-sonnet-4-5": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "claude-opus-4-6": { inputPerMillion: 15.0, outputPerMillion: 75.0 },
  "gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "gemini-2.5-flash": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  "llama-3.1-8b-instant": { inputPerMillion: 0, outputPerMillion: 0 },
  "llama-3.3-70b-versatile": { inputPerMillion: 0, outputPerMillion: 0 },
  "llama-4-scout-17b-16e-instruct": { inputPerMillion: 0, outputPerMillion: 0 },
  "grok-2": { inputPerMillion: 2.0, outputPerMillion: 10.0 },
  "grok-2-mini": { inputPerMillion: 0.3, outputPerMillion: 1.0 },
  default: { inputPerMillion: 1.0, outputPerMillion: 3.0 },
};
