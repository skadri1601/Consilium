"use client";

import { Zap, Users, Brain, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";

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
    <div>
      <div className="eyebrow mb-3">Mode</div>
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
                aria-pressed={isSelected}
                className={cn(
                  "relative flex flex-col items-start gap-1.5 rounded-[10px] border p-3.5 text-left transition-all",
                  isSelected
                    ? "border-warm/40 bg-warm/12"
                    : "border-white/[0.08] bg-bg-1 hover:border-white/[0.18] hover:bg-bg-2",
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:-translate-y-[1px]",
                )}
              >
                {isSelected && (
                  <span className="absolute -top-px left-0 h-px w-full bg-warm" />
                )}
                <div className="flex items-center gap-2 w-full">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "text-warm" : "text-ink-tertiary",
                    )}
                  />
                  <span
                    className={cn(
                      "font-display text-[15px] tracking-[-0.01em] capitalize",
                      isSelected ? "text-warm italic" : "text-ink-primary",
                    )}
                  >
                    {mode}
                  </span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                    {config.estimatedTime}
                  </span>
                </div>
                <p className="text-[12px] text-ink-secondary leading-[1.45]">
                  {config.description}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em]">
                  <span className="text-ink-tertiary">
                    {config.rounds} round{config.rounds > 1 ? "s" : ""}
                  </span>
                  {config.subAgents && (
                    <span className="text-warm bg-warm/12 border border-warm/20 px-2 py-0.5 rounded-full">
                      Sub-agents
                    </span>
                  )}
                </div>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
