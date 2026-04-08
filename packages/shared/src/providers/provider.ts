export type Provider = "openai" | "anthropic" | "google" | "groq" | "xai";

export const PROVIDER_ENV_VARS: Record<Provider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
};

export const PROVIDER_DISPLAY_NAMES: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  groq: "Groq",
  xai: "xAI",
};

export const JUDGE_PRIORITY: Provider[] = ["anthropic", "google", "openai", "xai", "groq"];
