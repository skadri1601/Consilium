"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  ArrowLeft,
  Loader2,
  Send,
  SlidersHorizontal,
  User,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { AGENTS } from "@/shared/lib/constants";

interface DebateMessage {
  id: string;
  agentId: string;
  modelUsed: string;
  content: string;
  cost: number;
  latencyMs: number;
}

interface DebateRound {
  id: string;
  roundNumber: number;
  status: string;
  messages: DebateMessage[];
}

interface ConversationDebate {
  id: string;
  topic: string;
  status: string;
  modelsUsed: string[];
  totalCost: number;
  goldenPrompt: string | null;
  conversationId: string | null;
  createdAt: string;
  rounds: DebateRound[];
}

interface StreamEvent {
  event: string;
  roundNumber?: number;
  agentId?: string;
  chunk?: string;
  content?: string;
  goldenPrompt?: string;
  totalCost?: number;
  modelsUsed?: string[];
  message?: string;
}

const AGENT_NAME_MAP = new Map<string, string>(
  AGENTS.map((a) => [a.id, a.name]),
);

function getAgentDisplayName(agentId: string): string {
  return AGENT_NAME_MAP.get(agentId) ?? agentId;
}

async function fetchConversationDebates(
  debateId: string,
): Promise<ConversationDebate[]> {
  const response = await fetch(`/api/debates/${debateId}/conversation`);
  if (!response.ok) {
    const single = await fetch(`/api/debates/${debateId}`);
    if (!single.ok) return [];
    const data = await single.json();
    return [data];
  }
  return response.json();
}

function ChatBubbleUser({ content }: { content: string }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 justify-end mb-1">
          <span className="text-xs font-medium text-muted-foreground">You</span>
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
        <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}

function ChatBubbleAssistant({
  content,
  cost,
  modelsUsed,
}: {
  content: string;
  cost?: number;
  modelsUsed?: string[];
}) {
  return (
    <div className="flex gap-3">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Consilium
          </span>
          {cost != null && cost > 0 && (
            <span className="text-xs text-muted-foreground">
              ${cost.toFixed(4)}
            </span>
          )}
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm whitespace-pre-wrap">
          {content}
        </div>
        {modelsUsed && modelsUsed.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {modelsUsed.map((m) => (
              <span
                key={m}
                className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground"
              >
                {getAgentDisplayName(m)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSelector({
  selectedModels,
  onToggle,
}: {
  selectedModels: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Models for follow-up
      </p>
      <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto">
        {AGENTS.map((agent) => {
          const isSelected = selectedModels.includes(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => onToggle(agent.id)}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              <span>{agent.name}</span>
              {isSelected && <CheckCircle2 className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {selectedModels.length} selected (min 2)
      </p>
    </div>
  );
}

export function DebateDetail({ debateId }: { debateId: string }) {
  const [debates, setDebates] = useState<ConversationDebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingGolden, setStreamingGolden] = useState<string | null>(null);
  const [followUpModels, setFollowUpModels] = useState<string[]>([
    "gemini-3-flash-preview",
    "llama-3.1-8b-instant",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversationDebates(debateId);
      setDebates(data);
    } catch {
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [debateId]);

  useEffect(() => {
    loadConversation();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debates, streamingGolden]);

  const handleToggleModel = useCallback((id: string) => {
    setFollowUpModels((prev) => {
      if (prev.includes(id)) {
        return prev.filter((m) => m !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }, []);

  const handleSendFollowUp = useCallback(async () => {
    if (!followUpInput.trim() || sending || followUpModels.length < 2) return;

    const topic = followUpInput.trim();
    setFollowUpInput("");
    setSending(true);
    setStreamingGolden(null);

    const conversationId = debates[0]?.conversationId || null;

    try {
      const createResponse = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          models: followUpModels,
          ...(conversationId && { conversationId }),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to create follow-up",
        );
      }

      const newDebate = await createResponse.json();

      setDebates((prev) => [
        ...prev,
        {
          ...newDebate,
          rounds: newDebate.rounds || [],
          goldenPrompt: null,
        },
      ]);

      const eventSource = new EventSource(
        `/api/debates/${newDebate.id}/stream`,
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          const eventName = (data.event || "").replace(/_/g, ":");

          if (eventName === "consensus") {
            const golden =
              data.goldenPrompt ||
              (data as any).golden_prompt ||
              (data as any).consensus;
            setStreamingGolden(golden || null);
          }

          if (eventName === "done" || eventName === "debate:complete") {
            const finalGolden =
              data.goldenPrompt || (data as any).golden_prompt;
            if (finalGolden) {
              setStreamingGolden(null);
              setDebates((prev) =>
                prev.map((d) =>
                  d.id === newDebate.id
                    ? {
                        ...d,
                        goldenPrompt: finalGolden,
                        status: "completed",
                        totalCost: data.totalCost || d.totalCost,
                      }
                    : d,
                ),
              );
            }
            setSending(false);
            eventSource.close();
          }

          if (eventName === "error" || eventName === "debate:error") {
            setDebates((prev) =>
              prev.map((d) =>
                d.id === newDebate.id
                  ? {
                      ...d,
                      goldenPrompt: `Error: ${data.message || "Something went wrong"}`,
                      status: "failed",
                    }
                  : d,
              ),
            );
            setSending(false);
            eventSource.close();
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setSending(false);
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send follow-up";
      setDebates((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          topic,
          status: "failed",
          modelsUsed: followUpModels,
          totalCost: 0,
          goldenPrompt: `Error: ${errorMessage}`,
          conversationId,
          createdAt: new Date().toISOString(),
          rounds: [],
        },
      ]);
      setSending(false);
    }
  }, [followUpInput, sending, followUpModels, debates]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSendFollowUp();
      }
    },
    [handleSendFollowUp],
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error || debates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>{error || "Debate not found"}</p>
            <Button asChild className="mt-4">
              <Link href="/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstDebate = debates[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 border-b bg-background px-6 py-3">
        <div className="container mx-auto max-w-4xl flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">
              {firstDebate.topic}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date(firstDebate.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-6 py-6 space-y-6">
          {debates.map((debate, idx) => (
            <div key={debate.id} className="space-y-4">
              {idx > 0 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    Follow-up #{idx}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <ChatBubbleUser content={debate.topic} />

              {debate.status === "failed" ? (
                <ChatBubbleAssistant
                  content={`Debate failed: ${debate.goldenPrompt || "An unexpected error occurred. Please try again."}`}
                  modelsUsed={debate.modelsUsed}
                />
              ) : debate.goldenPrompt ? (
                <ChatBubbleAssistant
                  content={debate.goldenPrompt}
                  cost={debate.totalCost}
                  modelsUsed={debate.modelsUsed}
                />
              ) : debate.status === "processing" ||
                debate.status === "pending" ? (
                <div className="flex gap-3">
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Consilium
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Debating...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : debate.status === "completed" ? (
                <ChatBubbleAssistant
                  content="This debate completed but no synthesis was generated."
                  modelsUsed={debate.modelsUsed}
                  cost={debate.totalCost}
                />
              ) : null}
            </div>
          ))}

          {streamingGolden && <ChatBubbleAssistant content={streamingGolden} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-6 py-3">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question... (Ctrl+Enter to send)"
              disabled={sending}
              className="min-h-[44px] max-h-[120px] resize-none flex-1"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-[44px] w-[44px]"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56">
                <ModelSelector
                  selectedModels={followUpModels}
                  onToggle={handleToggleModel}
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleSendFollowUp}
              disabled={
                sending || !followUpInput.trim() || followUpModels.length < 2
              }
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {followUpModels.length} models selected
            {followUpModels.length < 2 && " (need at least 2)"}
          </p>
        </div>
      </div>
    </div>
  );
}
