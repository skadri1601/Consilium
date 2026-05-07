import { AGENTS } from "@/shared/lib/constants";

const AGENT_NAME_BY_ID = new Map<string, string>(
  AGENTS.map((agent) => [agent.id, agent.name]),
);

type ProviderKey =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "xai"
  | "default";

const THINKING_STYLES: Record<ProviderKey, string> = {
  openai:
    "border-emerald-400/40 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-transparent",
  anthropic:
    "border-amber-400/40 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-transparent",
  google:
    "border-blue-400/40 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-transparent",
  groq: "border-purple-400/40 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-transparent",
  xai: "border-red-400/40 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-transparent",
  default: "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5",
};

function resolveProvider(agentId: string): ProviderKey {
  const agentName = AGENT_NAME_BY_ID.get(agentId) || "";
  if (agentName.includes("GPT") || agentName.includes("o1")) return "openai";
  if (agentName.includes("Claude")) return "anthropic";
  if (agentName.includes("Gemini")) return "google";
  if (agentName.includes("Llama")) return "groq";
  if (agentName.includes("Grok")) return "xai";
  return "default";
}

export function getProviderStyles(agentId: string, status: string): string {
  if (status === "complete") {
    return "border-green-500/40 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-transparent";
  }

  if (status === "thinking") {
    return THINKING_STYLES[resolveProvider(agentId)];
  }

  return "border-muted bg-muted/30";
}

export function getAgentDisplayName(agentId: string): string {
  return AGENT_NAME_BY_ID.get(agentId) ?? agentId;
}
