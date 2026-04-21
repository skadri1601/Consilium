export const APP_NAME = "Consilium";
export const APP_DESCRIPTION =
  "Multi-agent debate platform for better prompts and recommendations";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AGENTS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective model from OpenAI",
    free: false,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most capable model",
    free: false,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    description: "OpenAI's latest flagship model",
    free: false,
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    provider: "OpenAI",
    description: "OpenAI's latest reasoning model",
    free: false,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Quick and efficient model from Anthropic",
    free: false,
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Anthropic's advanced model",
    free: false,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    description: "Anthropic's most powerful model",
    free: false,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal model from Google",
    free: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Google's latest fast model",
    free: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Google's advanced model",
    free: false,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Groq",
    description: "Fast Groq-hosted Llama 3.1 model",
    free: true,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "Groq",
    description: "High-capacity Groq-hosted Llama model",
    free: true,
  },
  {
    id: "llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    provider: "Groq",
    description: "Groq-hosted Llama 4 Scout model",
    free: true,
  },
  {
    id: "grok-2",
    name: "Grok 2",
    provider: "XAI",
    description: "xAI's most capable model",
    free: false,
  },
  {
    id: "grok-2-mini",
    name: "Grok 2 Mini",
    provider: "XAI",
    description: "Fast and efficient model from xAI",
    free: false,
  },
] as const;

export const FREE_MODEL_IDS = AGENTS.filter((a) => a.free).map((a) => a.id);

export const MIN_AGENTS_PER_DEBATE = 2;
export const MAX_AGENTS_PER_DEBATE = 5;

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  council: "/council",
  agents: "/agents",
  history: "/history",
  analytics: "/analytics",
  settings: "/settings",
} as const;
