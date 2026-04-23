"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { getAgentDisplayName } from "../utils/council-helpers";

interface TimelinePhase {
  name: string;
  status: "pending" | "active" | "complete" | "error";
  models?: { id: string; status: "thinking" | "complete" | "error" }[];
  duration?: number;
  cost?: number;
}

interface DebateTimelineProps {
  phases: TimelinePhase[];
  currentRound: number;
  maxRounds: number;
  totalCost: number;
  mode: string;
  convergence?: { score: number; converged: boolean };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function PhaseIcon({ status }: { status: TimelinePhase["status"] }) {
  switch (status) {
    case "complete":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-agree/40 bg-agree/14 text-agree"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      );
    case "active":
      return (
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-warm/50 bg-warm/14 text-warm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="absolute inset-0 rounded-full animate-ping bg-warm/20" />
        </div>
      );
    case "error":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dissent/40 bg-dissent/14 text-dissent">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-bg-2 text-ink-muted">
          <Clock className="h-4 w-4" />
        </div>
      );
  }
}

function ModelStatusDot({
  status,
}: {
  status: "thinking" | "complete" | "error";
}) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "thinking" && "bg-warm animate-warm-pulse",
        status === "complete" && "bg-agree",
        status === "error" && "bg-dissent",
      )}
    />
  );
}

function PhaseItem({
  phase,
  isLast,
}: {
  phase: TimelinePhase;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(phase.status === "active");
  const hasModels = phase.models && phase.models.length > 0;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <PhaseIcon status={phase.status} />
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 min-h-[24px]",
              phase.status === "complete" ? "bg-agree/40" : "bg-white/[0.08]",
            )}
          />
        )}
      </div>

      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
        <button
          onClick={() => hasModels && setExpanded(!expanded)}
          disabled={!hasModels}
          className={cn(
            "flex items-center gap-2 text-left w-full",
            hasModels && "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "font-display text-[15px] tracking-[-0.01em]",
              phase.status === "active" && "text-warm italic",
              phase.status === "complete" && "text-ink-primary",
              phase.status === "error" && "text-dissent",
              phase.status === "pending" && "text-ink-tertiary",
            )}
          >
            {phase.name}
          </span>
          {phase.duration !== undefined && (
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
              {formatDuration(phase.duration)}
            </span>
          )}
          {phase.cost !== undefined && (
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
              ${phase.cost.toFixed(4)}
            </span>
          )}
          {hasModels && (
            <span className="ml-auto text-ink-tertiary">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
        </button>

        <AnimatePresence>
          {expanded && hasModels && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1.5">
                {phase.models!.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center gap-2 rounded-[8px] border border-white/[0.06] bg-bg-2 px-3 py-1.5 text-[12px] text-ink-secondary"
                  >
                    <ModelStatusDot status={model.status} />
                    <span className="truncate">
                      {getAgentDisplayName(model.id)}
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                      {model.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DebateTimeline({
  phases,
  currentRound,
  maxRounds,
  totalCost,
  mode,
  convergence,
}: DebateTimelineProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="eyebrow">Timeline</div>
          <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
            Debate progress
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm bg-warm/12 border border-warm/30 rounded-full px-2 py-0.5 capitalize">
            {mode}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
            Round {currentRound}/{maxRounds}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {phases.map((phase, index) => (
          <PhaseItem
            key={`${phase.name}-${index}`}
            phase={phase}
            isLast={index === phases.length - 1}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Running cost
          </span>
          <span className="font-mono text-[13px] text-ink-primary">
            ${totalCost.toFixed(4)}
          </span>
        </div>

        {convergence && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                Convergence
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border",
                  convergence.converged
                    ? "bg-agree/14 text-agree border-agree/30"
                    : "bg-warm/12 text-warm border-warm/30",
                )}
              >
                {convergence.converged ? "Converged" : "Deliberating"}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-bg-2 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  convergence.converged ? "bg-agree" : "bg-warm",
                )}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(convergence.score * 100, 100)}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary text-right">
              {(convergence.score * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
