export const APP_NAME = "Consilium";
export const APP_DESCRIPTION =
  "Multi-agent debate platform for better prompts and recommendations";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AGENTS = [
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 Nano",
    provider: "OpenAI",
    description: "Lowest-cost OpenAI model for high-volume workloads",
    free: false,
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective OpenAI model",
    free: false,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    description: "OpenAI's flagship model for reasoning and coding",
    free: false,
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    description: "OpenAI's latest model with 1M context window",
    free: false,
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    provider: "OpenAI",
    description: "OpenAI's strongest model for the hardest tasks",
    free: false,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Anthropic's fastest model with near-frontier intelligence",
    free: false,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    description: "Anthropic's best speed-to-intelligence balance",
    free: false,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    description: "Anthropic's previous-generation flagship",
    free: false,
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    description: "Anthropic's most capable model for agentic coding",
    free: false,
  },
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash-Lite",
    provider: "Google",
    description: "Google's most cost-efficient Gemini 3 model",
    free: false,
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    description: "Google's frontier multimodal model at low cost",
    free: false,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Google's most advanced reasoning model",
    free: false,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Groq",
    description: "Fast Groq-hosted Llama for low-latency tasks",
    free: true,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "Groq",
    description: "High-capacity Groq-hosted Llama for general use",
    free: true,
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B (via Groq)",
    provider: "Groq",
    description: "OpenAI's flagship open-weight model on Groq",
    free: true,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B (via Groq)",
    provider: "Groq",
    description: "Smaller GPT-OSS model on Groq",
    free: true,
  },
  {
    id: "groq/compound",
    name: "Groq Compound",
    provider: "Groq",
    description: "Groq's agentic system with built-in web search and code execution",
    free: false,
  },
  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast",
    provider: "xAI",
    description: "xAI's fast coding model for inner-loop tasks",
    free: false,
  },
  {
    id: "grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast (non-reasoning)",
    provider: "xAI",
    description: "Fast non-reasoning Grok variant",
    free: false,
  },
  {
    id: "grok-4-1-fast-reasoning",
    name: "Grok 4.1 Fast (reasoning)",
    provider: "xAI",
    description: "Fast reasoning Grok variant",
    free: false,
  },
  {
    id: "grok-4.20",
    name: "Grok 4.20",
    provider: "xAI",
    description: "xAI's flagship four-agent reasoning model",
    free: false,
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    provider: "Moonshot",
    description: "Moonshot's frontier-scale 1T-parameter model",
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
