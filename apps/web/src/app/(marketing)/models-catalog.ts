export type ModelEntry = { id: string; label: string; free?: boolean };

export type ProviderModels = {
  provider: string;
  icon: string;
  blurb: string;
  models: ModelEntry[];
};

export const modelCatalog: ProviderModels[] = [
  {
    provider: "Anthropic",
    icon: "anthropic",
    blurb: "Claude 4 family — strongest reasoning and synthesis.",
    models: [
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    ],
  },
  {
    provider: "OpenAI",
    icon: "openai",
    blurb: "GPT-5 series — fast, mini, and pro tiers.",
    models: [
      { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.5-pro", label: "GPT-5.5 Pro" },
    ],
  },
  {
    provider: "Google",
    icon: "google",
    blurb: "Gemini 3 — long context and fast multimodal.",
    models: [
      { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
      { id: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
    ],
  },
  {
    provider: "Groq",
    icon: "groq",
    blurb: "Sub-second inference. Free tier available.",
    models: [
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", free: true },
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", free: true },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", free: true },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", free: true },
      { id: "groq/compound-mini", label: "Groq Compound Mini" },
      { id: "groq/compound", label: "Groq Compound" },
    ],
  },
  {
    provider: "xAI",
    icon: "xai",
    blurb: "Grok 4 — code-focused and reasoning variants.",
    models: [
      { id: "grok-code-fast-1", label: "Grok Code Fast" },
      { id: "grok-4-1-fast-non-reasoning", label: "Grok 4.1 Fast" },
      { id: "grok-4-1-fast-reasoning", label: "Grok 4.1 Reasoning" },
      { id: "grok-4-20", label: "Grok 4.20" },
    ],
  },
  {
    provider: "Moonshot",
    icon: "groq",
    blurb: "Kimi K2 — long-context reasoning.",
    models: [
      { id: "kimi-k2.5", label: "Kimi K2.5" },
      { id: "kimi-k2.6", label: "Kimi K2.6" },
      { id: "kimi-k2-thinking", label: "Kimi K2 Thinking" },
    ],
  },
  {
    provider: "OpenRouter",
    icon: "openai",
    blurb: "Free community models — backup for the free tier.",
    models: [
      { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B", free: true },
      { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B", free: true },
      { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder", free: true },
      { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 3 Super 120B", free: true },
      { id: "inclusionai/ling-2.6-1t:free", label: "Ling 2.6 1T", free: true },
    ],
  },
];
