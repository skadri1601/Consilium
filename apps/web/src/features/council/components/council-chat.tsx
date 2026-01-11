"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Bot, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCouncilStore } from "../store/council.store";
import { AgentSelector } from "./agent-selector";
import { GoldenPromptOutput } from "@/components/council/golden-prompt-output";
import { FeatureTooltip } from "../../../components/onboarding/feature-tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAuth } from "@/features/auth";
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
const SUPPORTED_PROVIDERS = ["ChatGPT", "Claude", "Google", "Groq"];

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
  const { messages, selectedAgents, addMessage, isLoading, setLoading } = useCouncilStore();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const selectedAgentNames = selectedAgents.map(
    (agentId) => AGENT_NAME_BY_ID.get(agentId) ?? agentId
  );
  const selectedAgentsLabel =
    selectedAgentNames.length > 0
      ? `Selected: ${selectedAgentNames.join(", ")}`
      : "Select at least one agent to start a debate";

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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
      description: "Copy Golden Prompt",
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || selectedAgents.length === 0) return;

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
          content: "Synthesizing Golden Prompt from agent responses...",
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
      "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
      "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
      "llama-3.1-70b-versatile": "Llama 3.1 70B Versatile",
    };
    return names[agentId] || agentId;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: Collapsible Agent Selection */}
      <div className="lg:hidden">
        <AgentSelector />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Desktop: Sidebar Agent Selection */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <AgentSelector />
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Input Form - Top on Mobile for better UX */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Start a Debate</CardTitle>
                <FeatureTooltip content="Describe what you want to build. Multiple AI models will debate and synthesize the best approach into a Golden Prompt.">
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
                  disabled={isLoading || selectedAgents.length === 0}
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
                  Enter a description of what you want to build. Multiple AI agents will debate and create an optimized prompt.
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
                    disabled={isLoading || !input.trim() || selectedAgents.length === 0}
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
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start Debate
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Debate Progress - Agent Cards */}
          {streaming && Object.keys(agentProgress).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Round {currentRound} - Agents Deliberating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(agentProgress).map((agent) => (
                    <div
                      key={agent.agentId}
                      role="status"
                      aria-live="polite"
                      aria-label={`${getAgentDisplayName(agent.agentId)} - ${agent.status}`}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        agent.status === "thinking" && "border-primary bg-primary/5",
                        agent.status === "complete" && "border-green-500 bg-green-500/5",
                        agent.status === "pending" && "border-muted bg-muted/50",
                        agent.status === "error" && "border-red-500 bg-red-500/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {getAgentDisplayName(agent.agentId)}
                        </span>
                        {agent.status === "thinking" && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                        {agent.status === "complete" && (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                        {agent.status === "pending" && (
                          <span className="text-muted-foreground text-xs">Waiting</span>
                        )}
                      </div>
                      {agent.content && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {agent.content.slice(0, 150)}
                          {agent.content.length > 150 && "..."}
                        </p>
                      )}
                      {agent.status === "thinking" && !agent.content && (
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Golden Prompt Output */}
          {goldenPrompt && (
            <GoldenPromptOutput
              prompt={goldenPrompt}
              cost={debateCost || undefined}
              modelsUsed={modelsUsed}
            />
          )}

          {/* Empty State */}
          {!streaming && !goldenPrompt && messages.length === 0 && (
            <Card className="border-dashed" role="region" aria-label="Empty state">
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-lg font-medium mb-2">Start Your First Debate</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Select AI agents, describe what you want to build, and let them debate 
                  to create the perfect Golden Prompt for your coding AI.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
