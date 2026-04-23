"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            You
          </span>
          <div className="h-6 w-6 rounded-full bg-warm flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-bg-0" />
          </div>
        </div>
        <div className="rounded-[12px] rounded-tr-sm border border-warm/40 bg-warm/10 text-ink-primary px-4 py-3 text-[13px] whitespace-pre-wrap leading-[1.6]">
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
          <div className="h-6 w-6 rounded-full border border-warm/40 bg-warm/14 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-warm" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Consilium
          </span>
          {cost != null && cost > 0 && (
            <span className="font-mono text-[10px] text-ink-tertiary">
              ${cost.toFixed(4)}
            </span>
          )}
        </div>
        <div className="rounded-[12px] rounded-tl-sm border border-white/[0.08] bg-bg-1 text-ink-primary px-4 py-3 text-[13px] whitespace-pre-wrap leading-[1.7]">
          {content}
        </div>
        {modelsUsed && modelsUsed.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {modelsUsed.map((m) => (
              <span
                key={m}
                className="font-mono text-[9px] uppercase tracking-[0.06em] bg-bg-2 border border-white/[0.08] rounded-full px-2 py-0.5 text-ink-tertiary"
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
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
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
                "flex items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-[12px] transition-colors",
                isSelected
                  ? "bg-warm/12 text-warm border border-warm/30"
                  : "hover:bg-bg-2 text-ink-secondary border border-transparent",
              )}
            >
              <span>{agent.name}</span>
              {isSelected && <CheckCircle2 className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
        {selectedModels.length} selected · min 2
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
    "gemini-2.0-flash",
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
        <div className="flex items-center gap-2 text-ink-tertiary">
          <Loader2 className="h-4 w-4 animate-spin text-warm" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em]">
            Loading conversation…
          </span>
        </div>
      </div>
    );
  }

  if (error || debates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="surface-card p-6">
          <p className="text-[13px] text-ink-secondary">
            {error || "Debate not found"}
          </p>
          <Link
            href="/history"
            className="btn-consilium btn-consilium-ghost mt-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to history
          </Link>
        </div>
      </div>
    );
  }

  const firstDebate = debates[0];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0 border-b border-white/[0.06] bg-bg-0 px-6 py-3">
        <div className="container mx-auto max-w-4xl flex items-center gap-3">
          <Link
            href="/history"
            className="btn-consilium btn-consilium-ghost h-8 px-2"
            aria-label="Back to history"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[18px] tracking-[-0.01em] text-ink-primary truncate">
              {firstDebate.topic}
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
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
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Follow-up #{idx}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
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
                      <div className="h-6 w-6 rounded-full border border-warm/40 bg-warm/14 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-warm" />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        Consilium
                      </span>
                    </div>
                    <div className="rounded-[12px] rounded-tl-sm border border-white/[0.08] bg-bg-1 px-4 py-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-warm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Debating…</span>
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

      <div className="shrink-0 border-t border-white/[0.06] bg-bg-0 px-6 py-3">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question... (Ctrl+Enter to send)"
              disabled={sending}
              className="min-h-[44px] max-h-[120px] resize-none flex-1 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
            />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn-consilium btn-consilium-ghost shrink-0 h-[44px] w-[44px] justify-center"
                  aria-label="Model settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 surface-card p-3">
                <ModelSelector
                  selectedModels={followUpModels}
                  onToggle={handleToggleModel}
                />
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={handleSendFollowUp}
              disabled={
                sending || !followUpInput.trim() || followUpModels.length < 2
              }
              className="btn-consilium btn-consilium-primary shrink-0 h-[44px] w-[44px] justify-center"
              aria-label="Send follow-up"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mt-2">
            {followUpModels.length} models selected
            {followUpModels.length < 2 && " · need at least 2"}
          </p>
        </div>
      </div>
    </div>
  );
}
