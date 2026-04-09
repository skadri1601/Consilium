export type DebateMode = "quick" | "council" | "deep" | "blind" | "redteam" | "jury" | "market" | "auto";

export interface DebateModeConfig {
  rounds: number;
  subAgents: boolean;
  description: string;
  estimatedTime: string;
}

export const DEBATE_MODES: Record<DebateMode, DebateModeConfig> = {
  quick: { rounds: 1, subAgents: false, description: "Single round, fastest response", estimatedTime: "~15s" },
  council: { rounds: 3, subAgents: false, description: "Multi-round deliberation", estimatedTime: "~45s" },
  deep: { rounds: 5, subAgents: true, description: "Multi-round with sub-agent research", estimatedTime: "~90s" },
  blind: { rounds: 3, subAgents: false, description: "Names hidden until scored", estimatedTime: "~45s" },
  redteam: { rounds: 4, subAgents: true, description: "Adversarial red team assessment", estimatedTime: "~120s" },
  jury: { rounds: 3, subAgents: false, description: "Panel deliberation with voting", estimatedTime: "~60s" },
  market: { rounds: 5, subAgents: true, description: "Prediction market style confidence aggregation", estimatedTime: "~90s" },
  auto: { rounds: 3, subAgents: false, description: "Automatically selects best mode for topic", estimatedTime: "~45s" },
};

export function isValidMode(mode: string): mode is DebateMode {
  return mode in DEBATE_MODES;
}

export function getDefaultMode(): DebateMode {
  return "auto";
}
