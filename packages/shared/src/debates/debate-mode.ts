export type DebateMode = "quick" | "council" | "deep" | "blind";

export interface DebateModeConfig {
  rounds: number;
  subAgents: boolean;
  description: string;
  estimatedTime: string;
}

export const DEBATE_MODES: Record<DebateMode, DebateModeConfig> = {
  quick: { rounds: 1, subAgents: false, description: "Single round, fastest response", estimatedTime: "~15s" },
  council: { rounds: 3, subAgents: false, description: "Multi-round deliberation", estimatedTime: "~45s" },
  deep: { rounds: 3, subAgents: true, description: "Multi-round with sub-agent research", estimatedTime: "~90s" },
  blind: { rounds: 3, subAgents: false, description: "Names hidden until scored", estimatedTime: "~45s" },
};

export function isValidMode(mode: string): mode is DebateMode {
  return mode in DEBATE_MODES;
}

export function getDefaultMode(): DebateMode {
  return "council";
}
