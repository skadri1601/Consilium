"use client";

import { Zap, Users, Brain, EyeOff } from "lucide-react";

type DebateMode = "quick" | "council" | "deep" | "blind";

interface DebateModeConfig {
  rounds: number;
  subAgents: boolean;
  description: string;
  estimatedTime: string;
}

const DEBATE_MODES: Record<DebateMode, DebateModeConfig> = {
  quick: {
    rounds: 1,
    subAgents: false,
    description: "Single round, fastest response",
    estimatedTime: "~15s",
  },
  council: {
    rounds: 3,
    subAgents: false,
    description: "Multi-round deliberation",
    estimatedTime: "~45s",
  },
  deep: {
    rounds: 3,
    subAgents: true,
    description: "Multi-round with sub-agent research",
    estimatedTime: "~90s",
  },
  blind: {
    rounds: 3,
    subAgents: false,
    description: "Names hidden until scored",
    estimatedTime: "~45s",
  },
};

const MODE_ICONS = {
  quick: Zap,
  council: Users,
  deep: Brain,
  blind: EyeOff,
} as const;

interface DebateModeSelectorProps {
  selectedMode: DebateMode;
  onModeChange: (mode: DebateMode) => void;
  disabled?: boolean;
}

export function DebateModeSelector({
  selectedMode,
  onModeChange,
  disabled,
}: DebateModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {(Object.entries(DEBATE_MODES) as [DebateMode, DebateModeConfig][]).map(
        ([mode, config]) => {
          const Icon = MODE_ICONS[mode];
          const isSelected = selectedMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              disabled={disabled}
              className={`relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon
                  className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-sm font-medium capitalize ${isSelected ? "text-primary" : "text-foreground"}`}
                >
                  {mode}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {config.estimatedTime}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                {config.description}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {config.rounds} round{config.rounds > 1 ? "s" : ""}
                </span>
                {config.subAgents && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    Sub-agents
                  </span>
                )}
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
