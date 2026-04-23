"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCouncilStore } from "../store/council.store";
import { AgentSelector } from "./agent-selector";
import { DebateModeSelector } from "./debate-mode-selector";
import { SynthesisOutput } from "@/components/council/synthesis-output";
import { FeatureTooltip } from "../../../components/onboarding/feature-tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAuth } from "@/features/auth";
import { useUserPreferences } from "@/shared/hooks/use-user-preferences";
import { cn } from "@/shared/lib/utils";
import { AGENTS, FREE_MODEL_IDS } from "@/shared/lib/constants";
import { getAgentDisplayName } from "../utils/council-helpers";

interface AgentProgress {
  agentId: string;
  status: "pending" | "thinking" | "complete" | "error";
  content?: string;
}

interface StreamEvent {
  event: string;
  roundNumber?: number;
  agentId?: string;
  chunk?: string;
  content?: string;
  goldenPrompt?: string;
  totalCost?: number;
  total_cost?: number;
  modelsUsed?: string[];
  message?: string;
  consensus?: string;
  error?: string;
}

interface Persona {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
}

const AGENT_NAME_BY_ID = new Map<string, string>(
  AGENTS.map((agent) => [agent.id, agent.name]),
);
const SUPPORTED_PROVIDERS = [
  "ChatGPT",
  "Claude",
  "Google",
  "Groq",
  "Grok (XAI)",
];
const ROUND_DESCRIPTIONS: Record<number, string> = {
  1: "Independent Analysis",
  2: "Cross-Examination",
  3: "Rebuttal & Refinement",
  4: "Final Positions",
};

export function CouncilChat() {
  const [input, setInput] = useState("");
  const [usingFreeModels, setUsingFreeModels] = useState(false);
  const [, setDebateId] = useState<string | null>(null);
  const [goldenPrompt, setGoldenPrompt] = useState<string | null>(null);
  const [debateCost, setDebateCost] = useState<number | null>(null);
  const [modelsUsed, setModelsUsed] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundDescription, setRoundDescription] = useState<string>("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [agentProgress, setAgentProgress] = useState<
    Record<string, AgentProgress>
  >({});
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    messages,
    selectedAgents,
    addMessage,
    isLoading,
    setLoading,
    loadDefaults,
    setSelectedAgents,
    mode,
    setMode,
  } = useCouncilStore();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { preferences, isLoaded: isPrefsLoaded } = useUserPreferences();
  const selectedAgentNames = selectedAgents.map(
    (agentId) => AGENT_NAME_BY_ID.get(agentId) ?? agentId,
  );
  const selectedAgentsLabel =
    selectedAgentNames.length > 0
      ? `Selected: ${selectedAgentNames.join(", ")}`
      : "Select at least 2 agents to start a debate";

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPrefsLoaded) {
      loadDefaults(preferences);
    }
  }, [isPrefsLoaded, preferences, loadDefaults]);

  useEffect(() => {
    fetch("/api/personas", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonas(data);
        }
      })
      .catch(() => setPersonas([]));
  }, []);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string | null>) => {
        const hasAnyKey =
          data.openaiKey ||
          data.anthropicKey ||
          data.googleKey ||
          data.groqKey ||
          data.xaiKey;
        if (!hasAnyKey) {
          setSelectedAgents([...FREE_MODEL_IDS.slice(0, 2)]);
          setUsingFreeModels(true);
        }
      })
      .catch(() => {});
  }, [setSelectedAgents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentProgress]);

  useKeyboardShortcuts([
    {
      key: "k",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        textareaRef.current?.focus();
      },
      description: "Focus debate input",
    },
    {
      key: "Enter",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (input.trim() && !isLoading && selectedAgents.length > 0) {
          handleSubmit(new Event("submit") as unknown as React.FormEvent);
        }
      },
      description: "Submit debate",
    },
    {
      key: "c",
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (goldenPrompt) {
          navigator.clipboard.writeText(goldenPrompt);
        }
      },
      description: "Copy Synthesis",
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || selectedAgents.length < 2) return;

    const topic = input.trim();
    addMessage({ role: "user", content: topic });
    setInput("");
    setLoading(true);
    setStreaming(true);
    setGoldenPrompt(null);

    try {
      if (topic.length < 3) {
        addMessage({
          role: "assistant",
          content:
            "Please enter a longer topic (at least 3 characters) to start a debate.",
        });
        setLoading(false);
        setStreaming(false);
        return;
      }

      if (!isAuthLoaded) {
        throw new Error("Authentication not ready");
      }

      const createResponse = await fetch("/api/debates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          models: selectedAgents,
          mode,
          ...(selectedPersonaId && { personaId: selectedPersonaId }),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        const errorMsg =
          errorData.message ||
          errorData.error ||
          (Array.isArray(errorData)
            ? errorData.join(", ")
            : "Failed to create debate");
        throw new Error(errorMsg);
      }

      const debate = await createResponse.json();
      setDebateId(debate.id);

      const eventSource = new EventSource(`/api/debates/${debate.id}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          handleStreamEvent(data);
        } catch (error) {
          console.error("Failed to parse SSE event:", error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setStreaming(false);
        setLoading(false);
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      addMessage({
        role: "assistant",
        content: errorMessage.includes("topic")
          ? errorMessage
          : `Failed to start debate: ${errorMessage}`,
      });
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleStreamEvent = (data: StreamEvent) => {
    const eventName = (data.event || "").replace(/_/g, ":");
    const agentId =
      data.agentId || (data as any).agent_id || (data as any).agent;
    const chunk = data.chunk || (data as any).text;
    switch (eventName) {
      case "debate:start": {
        const initialProgress: Record<string, AgentProgress> = {};
        selectedAgents.forEach((agent) => {
          initialProgress[agent] = { agentId: agent, status: "pending" };
        });
        setAgentProgress(initialProgress);
        setCurrentRound(1);
        setRoundDescription(ROUND_DESCRIPTIONS[1] || "");
        setSynthesizing(false);
        break;
      }

      case "round:start": {
        const round = data.roundNumber ?? (data as any).round ?? 1;
        setCurrentRound(round);
        setRoundDescription(ROUND_DESCRIPTIONS[round] || `Round ${round}`);
        setSynthesizing(false);
        setAgentProgress((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((key) => {
            updated[key] = {
              ...updated[key],
              status: "pending",
              content: undefined,
            };
          });
          return updated;
        });
        break;
      }

      case "agent:start":
        if (agentId) {
          setAgentProgress((prev) => ({
            ...prev,
            [agentId]: { agentId, status: "thinking" },
          }));
        }
        break;

      case "agent:chunk":
        if (agentId) {
          setAgentProgress((prev) => ({
            ...prev,
            [agentId]: {
              ...prev[agentId],
              status: "thinking",
              content: (prev[agentId]?.content || "") + (chunk || ""),
            },
          }));
        }
        break;

      case "agent:complete":
        if (agentId) {
          setAgentProgress((prev) => ({
            ...prev,
            [agentId]: {
              agentId,
              status: "complete",
              content:
                data.content ||
                (data as any).response ||
                prev[agentId]?.content,
            },
          }));
        }
        break;

      case "synthesis:start":
        setSynthesizing(true);
        break;

      case "round:complete":
        break;

      case "judge:start":
        setSynthesizing(true);
        break;

      case "consensus":
        setGoldenPrompt(
          data.goldenPrompt || (data as any).golden_prompt || data.consensus,
        );
        setSynthesizing(false);
        break;

      case "cost:update":
        setDebateCost(data.totalCost ?? data.total_cost ?? null);
        break;

      case "done":
      case "debate:complete": {
        const finalGolden = data.goldenPrompt || (data as any).golden_prompt;
        if (finalGolden) {
          setGoldenPrompt(finalGolden);
        }
        const finalCost = data.totalCost || (data as any).total_cost;
        if (finalCost) {
          setDebateCost(finalCost);
        }
        setModelsUsed(
          data.modelsUsed || (data as any).models || selectedAgents,
        );
        setStreaming(false);
        setLoading(false);
        setCurrentRound(0);
        setRoundDescription("");
        setSynthesizing(false);
        setAgentProgress({});
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;
      }

      case "error":
      case "debate:error":
        addMessage({
          role: "assistant",
          content: `Error: ${data.message || data.error || "Something went wrong during the debate."}`,
        });
        setStreaming(false);
        setLoading(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <AgentSelector />

      <DebateModeSelector
        selectedMode={mode}
        onModeChange={setMode}
        disabled={isLoading}
      />

      {usingFreeModels && (
        <div className="rounded-[10px] border border-agree/30 bg-agree/14 px-4 py-3 text-[13px] text-agree flex items-center justify-between">
          <span>
            Using free Groq models. Add API keys in Settings for more options.
          </span>
          <a
            href="/settings"
            className="font-mono text-[11px] uppercase tracking-[0.06em] hover:text-ink-primary transition-colors"
          >
            Settings →
          </a>
        </div>
      )}

      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow mb-2">Start a deliberation</div>
            <h2 className="font-display font-light text-[22px] tracking-[-0.01em] text-ink-primary">
              Pose your question.
            </h2>
          </div>
          <FeatureTooltip content="Describe what you want the council to debate. The selected models will propose, challenge, and synthesize a verdict.">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary cursor-help">
              What is this?
            </span>
          </FeatureTooltip>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {personas.length > 0 && (
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              disabled={isLoading}
              aria-label="Select a persona"
              className="w-full rounded-[8px] border border-white/[0.08] bg-bg-2 px-3 py-2 text-[13px] text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm/40 focus-visible:border-warm/30"
            >
              <option value="">No persona (standard mode)</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build. Be specific about features, tech stack, and requirements… (Cmd/Ctrl+K to focus)"
            disabled={isLoading || selectedAgents.length < 2}
            className="min-h-[120px] resize-none rounded-[10px] border-white/[0.08] bg-bg-2 text-[14px] text-ink-primary placeholder:text-ink-muted focus-visible:ring-warm/40 focus-visible:border-warm/30"
            suppressHydrationWarning
            aria-label="Debate topic input"
            aria-describedby="debate-input-help"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
          <span id="debate-input-help" className="sr-only">
            Describe what you want to build. The council will debate and produce
            a synthesized recommendation.
          </span>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary min-w-0 gap-1">
              <span>
                {selectedAgentsLabel}
                {input.length > 0 && ` · ${input.length} chars`}
              </span>
              <span>Providers: {SUPPORTED_PROVIDERS.join(" · ")}</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || selectedAgents.length < 2}
              className="btn-consilium btn-consilium-primary btn-consilium-lg min-w-[160px] justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Start debate with selected agents"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deliberating…
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Start deliberation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {streaming && Object.keys(agentProgress).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="surface-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="block h-1.5 w-1.5 rounded-full bg-warm animate-warm-pulse" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm">
                    Round {currentRound} · In progress
                  </div>
                  <div className="font-display text-[16px] tracking-[-0.01em] text-ink-primary italic">
                    {roundDescription || "Deliberating"}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                {
                  Object.values(agentProgress).filter(
                    (a) => a.status === "complete",
                  ).length
                }{" "}
                / {Object.keys(agentProgress).length} complete
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {Object.values(agentProgress).map((agent, index) => (
                    <motion.div
                      key={agent.agentId}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08, duration: 0.2 }}
                      role="status"
                      aria-live="polite"
                      aria-label={`${getAgentDisplayName(agent.agentId)} - ${agent.status}`}
                      className={cn(
                        "relative overflow-hidden rounded-[10px] border p-4 transition-all duration-300",
                        agent.status === "thinking" &&
                          "border-warm/40 bg-warm/8",
                        agent.status === "complete" &&
                          "border-agree/30 bg-agree/8",
                        agent.status === "pending" &&
                          "border-white/[0.08] bg-bg-2",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              agent.status === "thinking" &&
                                "bg-warm animate-warm-pulse",
                              agent.status === "complete" && "bg-agree",
                              agent.status === "pending" && "bg-ink-muted",
                            )}
                          />
                          <span className="font-display text-[15px] font-normal tracking-[-0.01em] text-ink-primary truncate">
                            {getAgentDisplayName(agent.agentId)}
                          </span>
                        </div>
                        {agent.status === "thinking" && (
                          <span
                            className="font-mono text-[10px] uppercase tracking-[0.06em] text-warm"
                            aria-hidden
                          >
                            thinking
                          </span>
                        )}
                        {agent.status === "complete" && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="font-mono text-[10px] uppercase tracking-[0.06em] text-agree"
                          >
                            ✓ done
                          </motion.span>
                        )}
                        {agent.status === "pending" && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted">
                            queued
                          </span>
                        )}
                      </div>

                      {agent.content && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-[13px] text-ink-secondary leading-[1.55] line-clamp-4"
                        >
                          {agent.content.slice(0, 240)}
                          {agent.content.length > 240 && "…"}
                        </motion.div>
                      )}

                      {agent.status === "thinking" && !agent.content && (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-tertiary">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Analyzing…</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {synthesizing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-3 rounded-[10px] border border-warm/30 bg-warm/10 px-4 py-3"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-warm" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-warm">
                    Judge synthesizing verdict…
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length > 0 && (
        <div className="surface-card p-5">
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[10px] px-4 py-2.5 text-[13px] leading-[1.55]",
                    message.role === "user"
                      ? "bg-warm/14 text-ink-primary border border-warm/30"
                      : "bg-bg-2 text-ink-secondary border border-white/[0.08]",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {goldenPrompt && (
        <SynthesisOutput
          prompt={goldenPrompt}
          cost={debateCost || undefined}
          modelsUsed={modelsUsed}
        />
      )}

      {!streaming && !goldenPrompt && messages.length === 0 && (
        <div
          className="surface-card border-dashed p-12 text-center"
          role="region"
          aria-label="Empty state"
        >
          <div className="idle-icon mx-auto mb-5" aria-hidden />
          <div className="eyebrow justify-center mb-3">Idle</div>
          <h3 className="font-display font-light text-[22px] tracking-[-0.02em] text-ink-primary mb-2">
            Awaiting a topic.
          </h3>
          <p className="text-[13px] text-ink-secondary max-w-[420px] mx-auto leading-[1.55]">
            Select two or more models, pose a question, and the council will
            propose, challenge, and synthesize a verdict.
          </p>
        </div>
      )}
    </div>
  );
}
