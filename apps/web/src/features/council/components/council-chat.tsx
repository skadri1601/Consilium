"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { getProviderStyles, getAgentDisplayName } from "../utils/council-helpers";

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

const AGENT_NAME_BY_ID = new Map<string, string>(AGENTS.map((agent) => [agent.id, agent.name]));
const SUPPORTED_PROVIDERS = ["ChatGPT", "Claude", "Google", "Groq", "Grok (XAI)"];
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
  const [agentProgress, setAgentProgress] = useState<Record<string, AgentProgress>>({});
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, selectedAgents, addMessage, isLoading, setLoading, loadDefaults, setSelectedAgents, mode, setMode } = useCouncilStore();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { preferences, isLoaded: isPrefsLoaded } = useUserPreferences();
  const selectedAgentNames = selectedAgents.map(
    (agentId) => AGENT_NAME_BY_ID.get(agentId) ?? agentId
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
          data.openaiKey || data.anthropicKey || data.googleKey || data.groqKey || data.xaiKey;
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
          content: "Please enter a longer topic (at least 3 characters) to start a debate.",
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
        const errorMsg = errorData.message || errorData.error || (Array.isArray(errorData) ? errorData.join(", ") : "Failed to create debate");
        throw new Error(errorMsg);
      }

      const debate = await createResponse.json();
      setDebateId(debate.id);

      const eventSource = new EventSource(
        `/api/debates/${debate.id}/stream`
      );
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
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      addMessage({
        role: "assistant",
        content: errorMessage.includes("topic") ? errorMessage : `Failed to start debate: ${errorMessage}`,
      });
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleStreamEvent = (data: StreamEvent) => {
    const eventName = (data.event || "").replace(/_/g, ":");
    const agentId = data.agentId || (data as any).agent_id || (data as any).agent;
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
            updated[key] = { ...updated[key], status: "pending", content: undefined };
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
              content: data.content || (data as any).response || prev[agentId]?.content,
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
        setGoldenPrompt(data.goldenPrompt || (data as any).golden_prompt || data.consensus);
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
        setModelsUsed(data.modelsUsed || (data as any).models || selectedAgents);
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
    <div className="flex flex-col gap-4">
      <AgentSelector />

      <DebateModeSelector selectedMode={mode} onModeChange={setMode} disabled={isLoading} />

      {usingFreeModels && (
        <div className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center justify-between">
          <span>Using free models. Add API keys in Settings for more options.</span>
          <a href="/settings" className="font-medium underline hover:no-underline">Settings</a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Start a Debate</CardTitle>
                <FeatureTooltip content="Describe what you want to build. The council will debate and produce a synthesized recommendation.">
                  <span className="text-xs text-muted-foreground">What is this?</span>
                </FeatureTooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {personas.length > 0 && (
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    disabled={isLoading}
                    aria-label="Select a persona"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  placeholder="Describe what you want to build. Be specific about features, tech stack, and requirements... (Cmd/Ctrl+K to focus)"
                  disabled={isLoading || selectedAgents.length < 2}
                  className="min-h-[100px] resize-none"
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
                  Describe what you want to build. The council will debate and produce a synthesized recommendation.
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col text-xs text-muted-foreground min-w-0">
                    <span>
                      {selectedAgentsLabel}
                      {input.length > 0 && ` | ${input.length} chars`}
                    </span>
                    <span>Supports: {SUPPORTED_PROVIDERS.join(", ")}</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || selectedAgents.length < 2}
                    className="min-w-[120px]"
                    aria-label="Start debate with selected agents"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Debating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Debate
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <AnimatePresence>
            {streaming && Object.keys(agentProgress).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="elevated" className="overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Round {currentRound}{roundDescription && `: ${roundDescription}`}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {Object.values(agentProgress).filter(a => a.status === "complete").length} / {Object.keys(agentProgress).length} complete
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {Object.values(agentProgress).map((agent, index) => (
                          <motion.div
                            key={agent.agentId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.2 }}
                            role="status"
                            aria-live="polite"
                            aria-label={`${getAgentDisplayName(agent.agentId)} - ${agent.status}`}
                            className={cn(
                              "relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300",
                              getProviderStyles(agent.agentId, agent.status),
                              agent.status === "thinking" && "shadow-md",
                              agent.status === "complete" && "shadow-sm"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  agent.status === "thinking" && "bg-primary animate-pulse",
                                  agent.status === "complete" && "bg-green-500",
                                  agent.status === "pending" && "bg-gray-300"
                                )} />
                                <span className="font-semibold text-sm truncate">
                                  {getAgentDisplayName(agent.agentId)}
                                </span>
                              </div>
                              {agent.status === "thinking" && (
                                <div className="flex gap-0.5" aria-hidden>
                                  <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              )}
                              {agent.status === "complete" && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-green-600 dark:text-green-400 text-sm font-semibold"
                                >
                                  ✓
                                </motion.span>
                              )}
                              {agent.status === "pending" && (
                                <span className="text-xs text-muted-foreground">Waiting</span>
                              )}
                            </div>

                            {agent.content && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-xs text-muted-foreground line-clamp-4 leading-relaxed"
                              >
                                {agent.content.slice(0, 200)}
                                {agent.content.length > 200 && "..."}
                              </motion.div>
                            )}

                            {agent.status === "thinking" && !agent.content && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Analyzing...</span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {synthesizing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-3 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent p-3"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Judge synthesizing golden prompt...
                        </span>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>
          )}

          {goldenPrompt && (
            <SynthesisOutput
              prompt={goldenPrompt}
              cost={debateCost || undefined}
              modelsUsed={modelsUsed}
            />
          )}

          {!streaming && !goldenPrompt && messages.length === 0 && (
            <Card className="border-dashed" role="region" aria-label="Empty state">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-lg font-medium mb-2">Start your first debate</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Select agents, describe what you want to build, and get a synthesized
                  recommendation from the council.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
