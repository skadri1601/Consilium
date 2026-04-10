"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Shield,
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { getAgentDisplayName } from "../../council/utils/council-helpers";

type PhaseStatus = "pending" | "active" | "complete" | "error";

type PhaseKey =
  | "PROPOSAL"
  | "CHALLENGE"
  | "REBUTTAL"
  | "EVALUATION"
  | "VOTE"
  | "CONVERGENCE"
  | "OUTPUT";

interface ModelOutput {
  modelId: string;
  content: string;
  status: "thinking" | "complete" | "error";
  tokens?: number;
  cost?: number;
  durationMs?: number;
}

interface TimelinePhase {
  key: PhaseKey;
  label: string;
  status: PhaseStatus;
  timestamp?: string;
  modelOutputs: ModelOutput[];
  description?: string;
}

interface DebateTimelineProps {
  debateId: string;
  initialPhases?: TimelinePhase[];
  autoConnect?: boolean;
}

interface SsePayload {
  event: string;
  debate_id?: string;
  topic?: string;
  models?: string[];
  round_count?: number;
  round?: number;
  roundNumber?: number;
  description?: string;
  agentId?: string;
  agent_id?: string;
  agent?: string;
  chunk?: string;
  text?: string;
  content?: string;
  response?: string;
  tokens?: number;
  cost?: number;
  durationMs?: number;
  goldenPrompt?: string;
  golden_prompt?: string;
  totalCost?: number;
  total_cost?: number;
  modelsUsed?: string[];
  message?: string;
  error?: string;
  similarity?: number;
  skippingRounds?: boolean;
  consensus?: string;
  judgeModel?: string;
  status?: string;
}

const PHASE_CONFIG: Record<PhaseKey, { icon: typeof MessageSquare; label: string }> = {
  PROPOSAL: { icon: MessageSquare, label: "Proposal" },
  CHALLENGE: { icon: Shield, label: "Challenge" },
  REBUTTAL: { icon: ArrowRight, label: "Rebuttal" },
  EVALUATION: { icon: BarChart3, label: "Evaluation" },
  VOTE: { icon: Users, label: "Vote" },
  CONVERGENCE: { icon: Zap, label: "Convergence" },
  OUTPUT: { icon: Trophy, label: "Output" },
};

const PHASE_ORDER: PhaseKey[] = [
  "PROPOSAL",
  "CHALLENGE",
  "REBUTTAL",
  "EVALUATION",
  "VOTE",
  "CONVERGENCE",
  "OUTPUT",
];

const ROUND_TO_PHASE: Record<number, PhaseKey> = {
  1: "PROPOSAL",
  2: "CHALLENGE",
  3: "REBUTTAL",
  4: "EVALUATION",
};

function buildDefaultPhases(): TimelinePhase[] {
  return PHASE_ORDER.map((key) => ({
    key,
    label: PHASE_CONFIG[key].label,
    status: "pending" as PhaseStatus,
    modelOutputs: [],
  }));
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

function PhaseStatusIcon({ status }: { status: PhaseStatus }) {
  switch (status) {
    case "complete":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      );
    case "active":
      return (
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/25" />
        </div>
      );
    case "error":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-muted-foreground/25 bg-muted">
          <Clock className="h-4 w-4 text-muted-foreground/60" />
        </div>
      );
  }
}

function ModelStatusIndicator({ status }: { status: ModelOutput["status"] }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "thinking" && "bg-primary animate-pulse",
        status === "complete" && "bg-green-500",
        status === "error" && "bg-destructive"
      )}
    />
  );
}

function PhaseCard({ phase, isLast }: { phase: TimelinePhase; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasOutputs = phase.modelOutputs.length > 0;
  const PhaseIcon = PHASE_CONFIG[phase.key].icon;

  useEffect(() => {
    if (phase.status === "active") {
      setExpanded(true);
    }
  }, [phase.status]);

  return (
    <motion.div
      className="relative flex gap-3 sm:gap-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center shrink-0">
        <PhaseStatusIcon status={phase.status} />
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[32px] transition-colors duration-500",
              phase.status === "complete" ? "bg-green-500/50" : "bg-muted-foreground/15"
            )}
          />
        )}
      </div>

      <div className={cn("flex-1 min-w-0", !isLast && "pb-4")}>
        <button
          onClick={() => hasOutputs && setExpanded(!expanded)}
          disabled={!hasOutputs}
          className={cn(
            "flex items-center gap-2 text-left w-full group",
            hasOutputs && "cursor-pointer"
          )}
        >
          <PhaseIcon
            className={cn(
              "h-4 w-4 shrink-0",
              phase.status === "active" && "text-primary",
              phase.status === "complete" && "text-green-600 dark:text-green-400",
              phase.status === "error" && "text-destructive",
              phase.status === "pending" && "text-muted-foreground/50"
            )}
          />
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              phase.status === "active" && "text-primary",
              phase.status === "complete" && "text-green-600 dark:text-green-400",
              phase.status === "error" && "text-destructive",
              phase.status === "pending" && "text-muted-foreground"
            )}
          >
            {phase.label}
          </span>

          {phase.status === "active" && (
            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 animate-pulse">
              In Progress
            </span>
          )}
          {phase.status === "complete" && (
            <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-medium px-2 py-0.5">
              Complete
            </span>
          )}
          {phase.status === "error" && (
            <span className="rounded-full bg-destructive/10 text-destructive text-[10px] font-medium px-2 py-0.5">
              Error
            </span>
          )}

          {phase.timestamp && (
            <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
              {formatTimestamp(phase.timestamp)}
            </span>
          )}

          {hasOutputs && (
            <span className="text-muted-foreground ml-auto sm:ml-2 group-hover:text-foreground transition-colors">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
        </button>

        {phase.description && phase.status !== "pending" && (
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            {phase.description}
          </p>
        )}

        <AnimatePresence>
          {expanded && hasOutputs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 ml-6">
                {phase.modelOutputs.map((output) => (
                  <motion.div
                    key={output.modelId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "rounded-lg border p-3 text-sm transition-all",
                      output.status === "thinking" && "border-primary/30 bg-primary/5",
                      output.status === "complete" && "border-green-500/20 bg-green-50/50 dark:bg-green-950/10",
                      output.status === "error" && "border-destructive/20 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ModelStatusIndicator status={output.status} />
                      <span className="font-medium text-xs truncate">
                        {getAgentDisplayName(output.modelId)}
                      </span>
                      {output.status === "thinking" && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />
                      )}
                      {output.durationMs !== undefined && output.status === "complete" && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {output.durationMs < 1000
                            ? `${output.durationMs}ms`
                            : `${(output.durationMs / 1000).toFixed(1)}s`}
                        </span>
                      )}
                    </div>
                    {output.content && (
                      <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
                        {output.content}
                      </div>
                    )}
                    {output.status === "thinking" && !output.content && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Analyzing</span>
                        <span className="flex gap-0.5">
                          <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function DebateTimeline({ debateId, initialPhases, autoConnect = true }: DebateTimelineProps) {
  const [phases, setPhases] = useState<TimelinePhase[]>(initialPhases ?? buildDefaultPhases);
  const [totalCost, setTotalCost] = useState(0);
  const [connected, setConnected] = useState(false);
  const [finished, setFinished] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const updatePhase = useCallback((key: PhaseKey, updater: (p: TimelinePhase) => TimelinePhase) => {
    setPhases((prev) => prev.map((p) => (p.key === key ? updater(p) : p)));
  }, []);

  const activatePhase = useCallback(
    (key: PhaseKey, description?: string) => {
      setPhases((prev) =>
        prev.map((p) => {
          if (p.key === key) {
            return { ...p, status: "active", timestamp: new Date().toISOString(), description };
          }
          const idx = PHASE_ORDER.indexOf(p.key);
          const targetIdx = PHASE_ORDER.indexOf(key);
          if (idx < targetIdx && p.status !== "complete" && p.status !== "error") {
            return { ...p, status: "complete", timestamp: p.timestamp || new Date().toISOString() };
          }
          return p;
        })
      );
    },
    []
  );

  const completePhase = useCallback(
    (key: PhaseKey) => {
      updatePhase(key, (p) => ({ ...p, status: "complete", timestamp: p.timestamp || new Date().toISOString() }));
    },
    [updatePhase]
  );

  const handleSseEvent = useCallback(
    (data: SsePayload) => {
      const eventName = (data.event || "").replace(/_/g, ":");
      const agentId = data.agentId || data.agent_id || data.agent;
      const chunk = data.chunk || data.text;

      switch (eventName) {
        case "debate:start": {
          setPhases(buildDefaultPhases());
          activatePhase("PROPOSAL");
          break;
        }

        case "round:start": {
          const round = data.roundNumber ?? data.round ?? 1;
          const phaseKey = ROUND_TO_PHASE[round];
          if (phaseKey) {
            activatePhase(phaseKey, data.description);
          }
          break;
        }

        case "agent:start": {
          if (!agentId) break;
          const currentActive = PHASE_ORDER.find((k) =>
            phases.find((p) => p.key === k && p.status === "active")
          );
          const targetPhase = currentActive || "PROPOSAL";
          updatePhase(targetPhase as PhaseKey, (p) => ({
            ...p,
            modelOutputs: [
              ...p.modelOutputs.filter((m) => m.modelId !== agentId),
              { modelId: agentId, content: "", status: "thinking" },
            ],
          }));
          break;
        }

        case "agent:chunk": {
          if (!agentId || !chunk) break;
          setPhases((prev) =>
            prev.map((p) => {
              if (p.status !== "active") return p;
              const modelIdx = p.modelOutputs.findIndex((m) => m.modelId === agentId);
              if (modelIdx === -1) return p;
              const updated = [...p.modelOutputs];
              updated[modelIdx] = {
                ...updated[modelIdx],
                content: (updated[modelIdx].content || "") + chunk,
              };
              return { ...p, modelOutputs: updated };
            })
          );
          break;
        }

        case "agent:complete": {
          if (!agentId) break;
          setPhases((prev) =>
            prev.map((p) => {
              const modelIdx = p.modelOutputs.findIndex((m) => m.modelId === agentId);
              if (modelIdx === -1) return p;
              const updated = [...p.modelOutputs];
              updated[modelIdx] = {
                ...updated[modelIdx],
                status: "complete",
                content: data.content || data.response || updated[modelIdx].content,
                tokens: data.tokens,
                cost: data.cost,
                durationMs: data.durationMs,
              };
              return { ...p, modelOutputs: updated };
            })
          );
          break;
        }

        case "round:complete": {
          const round = data.roundNumber ?? data.round;
          if (round) {
            const phaseKey = ROUND_TO_PHASE[round];
            if (phaseKey) {
              completePhase(phaseKey);
            }
          }
          break;
        }

        case "convergence:detected": {
          activatePhase("CONVERGENCE", `Similarity: ${((data.similarity ?? 0) * 100).toFixed(0)}%`);
          if (data.skippingRounds) {
            completePhase("VOTE");
          }
          break;
        }

        case "judge:start": {
          activatePhase("EVALUATION", data.judgeModel ? `Judge: ${getAgentDisplayName(data.judgeModel)}` : undefined);
          break;
        }

        case "consensus": {
          completePhase("CONVERGENCE");
          activatePhase("OUTPUT", "Synthesis complete");
          if (data.goldenPrompt || data.golden_prompt || data.consensus) {
            updatePhase("OUTPUT", (p) => ({
              ...p,
              status: "complete",
              modelOutputs: [
                {
                  modelId: "judge",
                  content: (data.goldenPrompt || data.golden_prompt || data.consensus) as string,
                  status: "complete",
                },
              ],
            }));
          }
          const cost = data.totalCost ?? data.total_cost;
          if (cost) setTotalCost(cost);
          break;
        }

        case "cost:update": {
          const cost = data.totalCost ?? data.total_cost;
          if (cost) setTotalCost(cost);
          break;
        }

        case "done":
        case "debate:complete": {
          setPhases((prev) =>
            prev.map((p) => (p.status === "active" ? { ...p, status: "complete" } : p))
          );
          const finalGolden = data.goldenPrompt || data.golden_prompt;
          if (finalGolden) {
            updatePhase("OUTPUT", (p) => ({
              ...p,
              status: "complete",
              modelOutputs: p.modelOutputs.length > 0
                ? p.modelOutputs
                : [{ modelId: "judge", content: finalGolden, status: "complete" }],
            }));
          }
          const cost = data.totalCost ?? data.total_cost;
          if (cost) setTotalCost(cost);
          setFinished(true);
          setConnected(false);
          break;
        }

        case "error":
        case "debate:error": {
          setPhases((prev) =>
            prev.map((p) =>
              p.status === "active"
                ? { ...p, status: "error", description: data.message || data.error || "An error occurred" }
                : p
            )
          );
          setFinished(true);
          setConnected(false);
          break;
        }
      }
    },
    [activatePhase, completePhase, updatePhase, phases]
  );

  useEffect(() => {
    if (!autoConnect || !debateId || finished) return;

    const eventSource = new EventSource(`/api/debates/${debateId}/stream`);
    eventSourceRef.current = eventSource;
    setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SsePayload;
        handleSseEvent(data);
      } catch {
        // ignore
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setConnected(false);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [debateId, autoConnect, finished, handleSseEvent]);

  const completedCount = phases.filter((p) => p.status === "complete").length;
  const activePhase = phases.find((p) => p.status === "active");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Debate Timeline
            {connected && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-normal text-muted-foreground">Live</span>
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{completedCount}/{PHASE_ORDER.length} phases</span>
            {totalCost > 0 && <span className="font-mono">${totalCost.toFixed(4)}</span>}
          </div>
        </div>
        {activePhase && (
          <p className="text-xs text-muted-foreground">
            Currently: {activePhase.label}
            {activePhase.description && ` - ${activePhase.description}`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <AnimatePresence mode="sync">
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.key}
                phase={phase}
                isLast={index === phases.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>

        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">Debate Complete</span>
            {totalCost > 0 && (
              <span className="font-mono font-medium">${totalCost.toFixed(4)}</span>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export type { DebateTimelineProps, TimelinePhase, ModelOutput, PhaseKey, PhaseStatus };
