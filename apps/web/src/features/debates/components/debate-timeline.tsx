"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
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

const PHASE_CONFIG: Record<
  PhaseKey,
  { icon: typeof MessageSquare; label: string }
> = {
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

function findActivePhaseKeyFromList(
  phases: TimelinePhase[],
): PhaseKey | undefined {
  return PHASE_ORDER.find((k) =>
    phases.some((p) => p.key === k && p.status === "active"),
  );
}

function mergeAgentChunkInPhase(
  p: TimelinePhase,
  agentId: string,
  chunk: string,
): TimelinePhase {
  if (p.status !== "active") return p;
  const modelIdx = p.modelOutputs.findIndex((m) => m.modelId === agentId);
  if (modelIdx === -1) return p;
  const updated = [...p.modelOutputs];
  const row = updated[modelIdx];
  updated[modelIdx] = {
    ...row,
    content: (row.content || "") + chunk,
  };
  return { ...p, modelOutputs: updated };
}

function mergeAgentChunkPhases(
  prev: TimelinePhase[],
  agentId: string,
  chunk: string,
): TimelinePhase[] {
  return prev.map((p) => mergeAgentChunkInPhase(p, agentId, chunk));
}

function mergeAgentCompleteInPhase(
  p: TimelinePhase,
  agentId: string,
  data: SsePayload,
): TimelinePhase {
  const modelIdx = p.modelOutputs.findIndex((m) => m.modelId === agentId);
  if (modelIdx === -1) return p;
  const updated = [...p.modelOutputs];
  const row = updated[modelIdx];
  updated[modelIdx] = {
    ...row,
    status: "complete",
    content: data.content || data.response || row.content,
    tokens: data.tokens,
    cost: data.cost,
    durationMs: data.durationMs,
  };
  return { ...p, modelOutputs: updated };
}

function mergeAgentCompletePhases(
  prev: TimelinePhase[],
  agentId: string,
  data: SsePayload,
): TimelinePhase[] {
  return prev.map((p) => mergeAgentCompleteInPhase(p, agentId, data));
}

interface TimelineSseApi {
  phases: TimelinePhase[];
  setPhases: Dispatch<SetStateAction<TimelinePhase[]>>;
  activatePhase: (key: PhaseKey, description?: string) => void;
  completePhase: (key: PhaseKey) => void;
  updatePhase: (
    key: PhaseKey,
    updater: (p: TimelinePhase) => TimelinePhase,
  ) => void;
  setTotalCost: Dispatch<SetStateAction<number>>;
  setFinished: Dispatch<SetStateAction<boolean>>;
  setConnected: Dispatch<SetStateAction<boolean>>;
}

function handleTimelineDoneOrComplete(data: SsePayload, api: TimelineSseApi) {
  api.setPhases((prev) =>
    prev.map((p) => (p.status === "active" ? { ...p, status: "complete" } : p)),
  );
  const finalGolden = data.goldenPrompt || data.golden_prompt;
  if (finalGolden) {
    api.updatePhase("OUTPUT", (p) => ({
      ...p,
      status: "complete",
      modelOutputs:
        p.modelOutputs.length > 0
          ? p.modelOutputs
          : [{ modelId: "judge", content: finalGolden, status: "complete" }],
    }));
  }
  const cost = data.totalCost ?? data.total_cost;
  if (cost) api.setTotalCost(cost);
  api.setFinished(true);
  api.setConnected(false);
}

function handleTimelineError(data: SsePayload, api: TimelineSseApi) {
  api.setPhases((prev) =>
    prev.map((p) =>
      p.status === "active"
        ? {
            ...p,
            status: "error",
            description: data.message || data.error || "An error occurred",
          }
        : p,
    ),
  );
  api.setFinished(true);
  api.setConnected(false);
}

const TIMELINE_SSE_HANDLERS: Record<
  string,
  (data: SsePayload, api: TimelineSseApi) => void
> = {
  "debate:start": (_data, api) => {
    api.setPhases(buildDefaultPhases());
    api.activatePhase("PROPOSAL");
  },
  "round:start": (data, api) => {
    const round = data.roundNumber ?? data.round ?? 1;
    const phaseKey = ROUND_TO_PHASE[round];
    if (phaseKey) api.activatePhase(phaseKey, data.description);
  },
  "agent:start": (data, api) => {
    const agentId = data.agentId || data.agent_id || data.agent;
    if (!agentId) return;
    const currentActive = findActivePhaseKeyFromList(api.phases);
    const targetPhase: PhaseKey = currentActive ?? "PROPOSAL";
    api.updatePhase(targetPhase, (p) => ({
      ...p,
      modelOutputs: [
        ...p.modelOutputs.filter((m) => m.modelId !== agentId),
        { modelId: agentId, content: "", status: "thinking" },
      ],
    }));
  },
  "agent:chunk": (data, api) => {
    const agentId = data.agentId || data.agent_id || data.agent;
    const chunk = data.chunk || data.text;
    if (!agentId || !chunk) return;
    api.setPhases((prev) => mergeAgentChunkPhases(prev, agentId, chunk));
  },
  "agent:complete": (data, api) => {
    const agentId = data.agentId || data.agent_id || data.agent;
    if (!agentId) return;
    api.setPhases((prev) => mergeAgentCompletePhases(prev, agentId, data));
  },
  "round:complete": (data, api) => {
    const round = data.roundNumber ?? data.round;
    if (!round) return;
    const phaseKey = ROUND_TO_PHASE[round];
    if (phaseKey) api.completePhase(phaseKey);
  },
  "convergence:detected": (data, api) => {
    api.activatePhase(
      "CONVERGENCE",
      `Similarity: ${((data.similarity ?? 0) * 100).toFixed(0)}%`,
    );
    if (data.skippingRounds) api.completePhase("VOTE");
  },
  "judge:start": (data, api) => {
    api.activatePhase(
      "EVALUATION",
      data.judgeModel
        ? `Judge: ${getAgentDisplayName(data.judgeModel)}`
        : undefined,
    );
  },
  consensus: (data, api) => {
    api.completePhase("CONVERGENCE");
    api.activatePhase("OUTPUT", "Synthesis complete");
    const golden = data.goldenPrompt ?? data.golden_prompt ?? data.consensus;
    if (golden) {
      api.updatePhase("OUTPUT", (p) => ({
        ...p,
        status: "complete",
        modelOutputs: [
          { modelId: "judge", content: golden, status: "complete" },
        ],
      }));
    }
    const cost = data.totalCost ?? data.total_cost;
    if (cost) api.setTotalCost(cost);
  },
  "cost:update": (data, api) => {
    const cost = data.totalCost ?? data.total_cost;
    if (cost) api.setTotalCost(cost);
  },
  done: handleTimelineDoneOrComplete,
  "debate:complete": handleTimelineDoneOrComplete,
  error: handleTimelineError,
  "debate:error": handleTimelineError,
};

function dispatchTimelineSseEvent(
  eventName: string,
  data: SsePayload,
  api: TimelineSseApi,
) {
  const handler = TIMELINE_SSE_HANDLERS[eventName];
  if (handler) handler(data, api);
}

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
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function PhaseStatusIcon({ status }: Readonly<{ status: PhaseStatus }>) {
  switch (status) {
    case "complete":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-agree/40 bg-agree/14 text-agree"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      );
    case "active":
      return (
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-warm/50 bg-warm/14 text-warm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="absolute inset-0 rounded-full animate-ping bg-warm/20" />
        </div>
      );
    case "error":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dissent/40 bg-dissent/14 text-dissent">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-bg-2 text-ink-muted">
          <Clock className="h-4 w-4" />
        </div>
      );
  }
}

function ModelStatusIndicator({
  status,
}: Readonly<{ status: ModelOutput["status"] }>) {
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

function PhaseCard({
  phase,
  isLast,
}: Readonly<{ phase: TimelinePhase; isLast: boolean }>) {
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
              "w-px flex-1 min-h-[32px] transition-colors duration-500",
              phase.status === "complete" ? "bg-agree/40" : "bg-white/[0.08]",
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
            hasOutputs && "cursor-pointer",
          )}
        >
          <PhaseIcon
            className={cn(
              "h-4 w-4 shrink-0",
              phase.status === "active" && "text-warm",
              phase.status === "complete" && "text-agree",
              phase.status === "error" && "text-dissent",
              phase.status === "pending" && "text-ink-muted",
            )}
          />
          <span
            className={cn(
              "font-display text-[15px] tracking-[-0.01em] transition-colors",
              phase.status === "active" && "text-warm italic",
              phase.status === "complete" && "text-ink-primary",
              phase.status === "error" && "text-dissent",
              phase.status === "pending" && "text-ink-tertiary",
            )}
          >
            {phase.label}
          </span>

          {phase.status === "active" && (
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-warm bg-warm/12 border border-warm/30 rounded-full px-2 py-0.5">
              In progress
            </span>
          )}
          {phase.status === "complete" && (
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-agree bg-agree/14 border border-agree/30 rounded-full px-2 py-0.5">
              Complete
            </span>
          )}
          {phase.status === "error" && (
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-dissent bg-dissent/14 border border-dissent/30 rounded-full px-2 py-0.5">
              Error
            </span>
          )}

          {phase.timestamp && (
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary ml-auto hidden sm:inline">
              {formatTimestamp(phase.timestamp)}
            </span>
          )}

          {hasOutputs && (
            <span className="text-ink-tertiary ml-auto sm:ml-2 group-hover:text-ink-primary transition-colors">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
        </button>

        {phase.description && phase.status !== "pending" && (
          <p className="text-[12px] text-ink-tertiary mt-1 ml-6">
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
                      "rounded-[10px] border p-3 transition-all",
                      output.status === "thinking" &&
                        "border-warm/30 bg-warm/8",
                      output.status === "complete" &&
                        "border-agree/25 bg-agree/6",
                      output.status === "error" &&
                        "border-dissent/25 bg-dissent/6",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ModelStatusIndicator status={output.status} />
                      <span className="font-display text-[13px] tracking-[-0.01em] text-ink-primary truncate">
                        {getAgentDisplayName(output.modelId)}
                      </span>
                      {output.status === "thinking" && (
                        <Loader2 className="h-3 w-3 animate-spin text-warm ml-auto" />
                      )}
                      {output.durationMs !== undefined &&
                        output.status === "complete" && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary ml-auto">
                            {output.durationMs < 1000
                              ? `${output.durationMs}ms`
                              : `${(output.durationMs / 1000).toFixed(1)}s`}
                          </span>
                        )}
                    </div>
                    {output.content && (
                      <div className="text-[12px] text-ink-secondary leading-[1.6] whitespace-pre-wrap line-clamp-6">
                        {output.content}
                      </div>
                    )}
                    {output.status === "thinking" && !output.content && (
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                        <span>Analyzing</span>
                        <span className="flex gap-0.5">
                          <span
                            className="h-1 w-1 rounded-full bg-warm/70 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-1 w-1 rounded-full bg-warm/70 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-1 w-1 rounded-full bg-warm/70 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
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

export function DebateTimeline({
  debateId,
  initialPhases,
  autoConnect = true,
}: Readonly<DebateTimelineProps>) {
  const [phases, setPhases] = useState<TimelinePhase[]>(
    initialPhases ?? buildDefaultPhases,
  );
  const phasesRef = useRef<TimelinePhase[]>(phases);
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);
  const [totalCost, setTotalCost] = useState(0);
  const [connected, setConnected] = useState(false);
  const [finished, setFinished] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const updatePhase = useCallback(
    (key: PhaseKey, updater: (p: TimelinePhase) => TimelinePhase) => {
      setPhases((prev) => prev.map((p) => (p.key === key ? updater(p) : p)));
    },
    [],
  );

  const activatePhase = useCallback((key: PhaseKey, description?: string) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.key === key) {
          return {
            ...p,
            status: "active",
            timestamp: new Date().toISOString(),
            description,
          };
        }
        const idx = PHASE_ORDER.indexOf(p.key);
        const targetIdx = PHASE_ORDER.indexOf(key);
        if (
          idx < targetIdx &&
          p.status !== "complete" &&
          p.status !== "error"
        ) {
          return {
            ...p,
            status: "complete",
            timestamp: p.timestamp || new Date().toISOString(),
          };
        }
        return p;
      }),
    );
  }, []);

  const completePhase = useCallback(
    (key: PhaseKey) => {
      updatePhase(key, (p) => ({
        ...p,
        status: "complete",
        timestamp: p.timestamp || new Date().toISOString(),
      }));
    },
    [updatePhase],
  );

  const handleSseEvent = useCallback(
    (data: SsePayload) => {
      const eventName = (data.event || "").replaceAll("_", ":");
      dispatchTimelineSseEvent(eventName, data, {
        get phases() {
          return phasesRef.current;
        },
        setPhases,
        activatePhase,
        completePhase,
        updatePhase,
        setTotalCost,
        setFinished,
        setConnected,
      });
    },
    [
      activatePhase,
      completePhase,
      updatePhase,
      setPhases,
      setTotalCost,
      setFinished,
      setConnected,
    ],
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
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="eyebrow">Timeline</div>
          <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1 flex items-center gap-2">
            Debate progress
            {connected && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warm animate-warm-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm">
                  Live
                </span>
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
          <span>
            {completedCount}/{PHASE_ORDER.length} phases
          </span>
          {totalCost > 0 && (
            <span className="text-ink-primary">${totalCost.toFixed(4)}</span>
          )}
        </div>
      </div>
      {activePhase && (
        <p className="text-[12px] text-ink-tertiary mb-4">
          Currently: {activePhase.label}
          {activePhase.description && ` - ${activePhase.description}`}
        </p>
      )}

      <div className="flex flex-col mt-2">
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
          className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Debate complete
          </span>
          {totalCost > 0 && (
            <span className="font-mono text-[13px] text-ink-primary">
              ${totalCost.toFixed(4)}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

export type {
  DebateTimelineProps,
  TimelinePhase,
  ModelOutput,
  PhaseKey,
  PhaseStatus,
};
