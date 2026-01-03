export const APP_NAME = "Consilium";
export const APP_DESCRIPTION =
  "Multi-AI agent orchestration system for collaborative problem-solving";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AGENTS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o-mini",
    provider: "OpenAI",
    description: "Fast and cost-effective model from OpenAI",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Quick and efficient model from Anthropic",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal model from Google",
  },
  {
    id: "grok-2",
    name: "Grok-2",
    provider: "xAI",
    description: "Real-time knowledge model from xAI",
  },
] as const;

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
