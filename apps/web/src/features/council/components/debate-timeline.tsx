"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      );
    case "active":
      return (
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
        </div>
      );
    case "error":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-muted">
          <Clock className="h-4 w-4 text-muted-foreground" />
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
        status === "thinking" && "bg-primary animate-pulse",
        status === "complete" && "bg-green-500",
        status === "error" && "bg-destructive",
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
              "w-0.5 flex-1 min-h-[24px]",
              phase.status === "complete"
                ? "bg-green-500/50"
                : "bg-muted-foreground/20",
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
              "text-sm font-semibold",
              phase.status === "active" && "text-primary",
              phase.status === "complete" &&
                "text-green-600 dark:text-green-400",
              phase.status === "error" && "text-destructive",
              phase.status === "pending" && "text-muted-foreground",
            )}
          >
            {phase.name}
          </span>
          {phase.duration !== undefined && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(phase.duration)}
            </span>
          )}
          {phase.cost !== undefined && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {phase.cost.toFixed(4)}
            </span>
          )}
          {hasModels && (
            <span className="ml-auto text-muted-foreground">
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
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs"
                  >
                    <ModelStatusDot status={model.status} />
                    <span className="truncate">
                      {getAgentDisplayName(model.id)}
                    </span>
                    <span className="ml-auto text-muted-foreground capitalize">
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Debate Timeline</CardTitle>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 capitalize">
              {mode}
            </span>
            <span className="text-xs text-muted-foreground">
              Round {currentRound}/{maxRounds}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {phases.map((phase, index) => (
            <PhaseItem
              key={`${phase.name}-${index}`}
              phase={phase}
              isLast={index === phases.length - 1}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Running Cost</span>
            <span className="font-mono font-medium">
              ${totalCost.toFixed(4)}
            </span>
          </div>

          {convergence && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Convergence</span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    convergence.converged
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                  )}
                >
                  {convergence.converged ? "Converged" : "Deliberating"}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    convergence.converged ? "bg-green-500" : "bg-primary",
                  )}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(convergence.score * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground text-right">
                {(convergence.score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
