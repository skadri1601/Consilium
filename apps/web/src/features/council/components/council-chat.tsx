"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCouncilStore } from "../store/council.store";
import { AgentSelector } from "./agent-selector";
import { SynthesisOutput } from "@/components/council/synthesis-output";
import { FeatureTooltip } from "../../../components/onboarding/feature-tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAuth } from "@/features/auth";
import { useUserPreferences } from "@/shared/hooks/use-user-preferences";
import { cn } from "@/shared/lib/utils";
import { AGENTS, API_URL } from "@/shared/lib/constants";

interface AgentProgress {
  agentId: string;
  status: "pending" | "thinking" | "complete" | "error";
  content?: string;
}

interface RoundProgress {
  roundNumber: number;
  status: "pending" | "in_progress" | "complete";
  agents: AgentProgress[];
}

const AGENT_NAME_BY_ID = new Map(AGENTS.map((agent) => [agent.id, agent.name]));
const SUPPORTED_PROVIDERS = ["ChatGPT", "Claude", "Google", "Groq", "Grok (XAI)"];

// Provider-specific subtle gradients (professional, not flashy)
const getProviderStyles = (agentId: string, status: string) => {
  const agentName = AGENT_NAME_BY_ID.get(agentId) || "";
  const provider = agentName.includes("GPT") || agentName.includes("o1") ? "openai"
    : agentName.includes("Claude") ? "anthropic"
    : agentName.includes("Gemini") ? "google"
    : agentName.includes("Llama") ? "groq"
    : agentName.includes("Grok") ? "xai"
    : "default";

  if (status === "complete") {
    return "border-green-500/40 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-transparent";
  }

  if (status === "thinking") {
    const styles: Record<string, string> = {
      openai: "border-emerald-400/40 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-transparent",
      anthropic: "border-amber-400/40 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-transparent",
      google: "border-blue-400/40 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-transparent",
      groq: "border-purple-400/40 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-transparent",
      xai: "border-red-400/40 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-transparent",
      default: "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5"
    };
    return styles[provider];
  }

  return "border-muted bg-muted/30";
};

export function CouncilChat() {
  const [input, setInput] = useState("");
  const [debateId, setDebateId] = useState<string | null>(null);
  const [goldenPrompt, setGoldenPrompt] = useState<string | null>(null);
  const [debateCost, setDebateCost] = useState<number | null>(null);
  const [modelsUsed, setModelsUsed] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [agentProgress, setAgentProgress] = useState<Record<string, AgentProgress>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, selectedAgents, addMessage, isLoading, setLoading, loadDefaults } = useCouncilStore();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
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

  // Load default agents & mode from Clerk user metadata (synced across devices)
  useEffect(() => {
    if (isPrefsLoaded) {
      loadDefaults(preferences);
    }
  }, [isPrefsLoaded, preferences, loadDefaults]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentProgress]);

  // Keyboard shortcuts
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
          const syntheticEvent = new Event("submit") as any;
          handleSubmit(syntheticEvent);
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
      // Create debate session
      if (!isAuthLoaded || !getToken) {
        throw new Error("Authentication not ready");
      }
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      // Use Next.js API route as proxy
      const createResponse = await fetch("/api/debates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          models: selectedAgents,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create debate");
      }

      const debate = await createResponse.json();
      setDebateId(debate.id);

      // Connect to SSE stream
      const eventSource = new EventSource(
        `${API_URL}/api/v1/debates/${debate.id}/stream?token=${token}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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
      console.error("Failed to start debate:", error);
      addMessage({
        role: "assistant",
        content: "Failed to start debate. Please try again.",
      });
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleStreamEvent = (data: any) => {
    switch (data.event) {
      case "debate:start":
        // Initialize agent progress
        const initialProgress: Record<string, AgentProgress> = {};
        selectedAgents.forEach((agent) => {
          initialProgress[agent] = { agentId: agent, status: "pending" };
        });
        setAgentProgress(initialProgress);
        setCurrentRound(1);
        break;
        
      case "round:start":
        setCurrentRound(data.roundNumber);
        // Set all agents to pending for new round
        setAgentProgress((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((key) => {
            updated[key] = { ...updated[key], status: "pending" };
          });
          return updated;
        });
        break;
        
      case "agent:start":
        setAgentProgress((prev) => ({
          ...prev,
          [data.agentId]: { agentId: data.agentId, status: "thinking" },
        }));
        break;
        
      case "agent:chunk":
        setAgentProgress((prev) => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            status: "thinking",
            content: (prev[data.agentId]?.content || "") + data.chunk,
          },
        }));
        break;
        
      case "agent:complete":
        setAgentProgress((prev) => ({
          ...prev,
          [data.agentId]: {
            agentId: data.agentId,
            status: "complete",
            content: data.content || prev[data.agentId]?.content,
          },
        }));
        break;
        
      case "synthesis:start":
        addMessage({
          role: "assistant",
          content: "Synthesizing from agent responses...",
        });
        break;
        
      case "debate:complete":
        setGoldenPrompt(data.goldenPrompt);
        setDebateCost(data.totalCost);
        setModelsUsed(data.modelsUsed || selectedAgents);
        setStreaming(false);
        setLoading(false);
        setCurrentRound(0);
        setAgentProgress({});
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;
        
      case "debate:error":
        addMessage({
          role: "assistant",
          content: `Error: ${data.message || "Something went wrong during the debate."}`,
        });
        setStreaming(false);
        setLoading(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;
    }
  };


  const getAgentDisplayName = (agentId: string) => {
    const names: Record<string, string> = {
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini",
      "o1": "GPT-o1",
      "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
      "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
      "claude-4.6-opus": "Claude Opus 4.6",
      "claude-4.5-sonnet": "Claude Sonnet 4.5",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
      "llama-3.1-70b-versatile": "Llama 3.1 70B Versatile",
      "grok-2": "Grok 2",
      "grok-2-mini": "Grok 2 Mini",
    };
    return names[agentId] || agentId;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Agent Selection */}
      <AgentSelector />

      <div className="flex flex-col gap-4">
        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Input Form - Top on Mobile for better UX */}
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

          {/* Debate Progress - Enhanced Agent Cards */}
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
                        Council Debate — Round {currentRound}
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
                            {/* Top bar with model name and status */}
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

                            {/* Streaming content */}
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

                            {/* Thinking state */}
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
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages History */}
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

          {/* Synthesis Output */}
          {goldenPrompt && (
            <SynthesisOutput
              prompt={goldenPrompt}
              cost={debateCost || undefined}
              modelsUsed={modelsUsed}
            />
          )}

          {/* Empty State */}
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
