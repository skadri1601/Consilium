export const APP_NAME = "Consilium";
export const APP_DESCRIPTION =
  "Multi-agent debate platform for better prompts and recommendations";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AGENTS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective model from OpenAI",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most capable model",
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Quick and efficient model from Anthropic",
  },
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Anthropic's advanced model",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal model from Google",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced model",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Groq",
    description: "Fast Groq-hosted Llama 3.1 model",
  },
  {
    id: "llama-3.1-70b-versatile",
    name: "Llama 3.1 70B Versatile",
    provider: "Groq",
    description: "High-capacity Groq-hosted Llama 3.1 model",
  },
  {
    id: "claude-4.6-opus",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    description: "Anthropic's most powerful model",
  },
  {
    id: "claude-4.5-sonnet",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Anthropic's latest balanced model",
  },
  {
    id: "o1",
    name: "GPT-o1",
    provider: "OpenAI",
    description: "OpenAI's reasoning model",
  },
  {
    id: "grok-2",
    name: "Grok 2",
    provider: "XAI",
    description: "xAI's most capable model",
  },
  {
    id: "grok-2-mini",
    name: "Grok 2 Mini",
    provider: "XAI",
    description: "Fast and efficient model from xAI",
  },
] as const;

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
