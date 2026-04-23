"use client";

import { useState, useEffect } from "react";
import { useCouncilStore } from "../store/council.store";
import {
  AGENTS,
  MIN_AGENTS_PER_DEBATE,
  MAX_AGENTS_PER_DEBATE,
} from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { Check, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export function AgentSelector() {
  const { selectedAgents, toggleAgent } = useCouncilStore();
  const [apiKeys, setApiKeys] = useState<{
    openaiKey: string | null;
    anthropicKey: string | null;
    googleKey: string | null;
    groqKey: string | null;
    xaiKey: string | null;
  }>({
    openaiKey: null,
    anthropicKey: null,
    googleKey: null,
    groqKey: null,
    xaiKey: null,
  });

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => {
        if (!res.ok) {
          return {
            openaiKey: null,
            anthropicKey: null,
            googleKey: null,
            groqKey: null,
            xaiKey: null,
          };
        }
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          setApiKeys({
            openaiKey: data.openaiKey || null,
            anthropicKey: data.anthropicKey || null,
            googleKey: data.googleKey || null,
            groqKey: data.groqKey || null,
            xaiKey: data.xaiKey || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const getProviderKey = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return apiKeys.openaiKey;
      case "anthropic":
        return apiKeys.anthropicKey;
      case "google":
        return apiKeys.googleKey;
      case "groq":
        return apiKeys.groqKey;
      case "xai":
        return apiKeys.xaiKey;
      default:
        return null;
    }
  };

  const hasKey = (agent: (typeof AGENTS)[number]) => {
    if (agent.free) return true;
    const key = getProviderKey(agent.provider);
    return key !== null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">Council members</div>
        {selectedAgents.length > 0 && (
          <span
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-warm px-2 py-0.5 rounded-full bg-warm/12 border border-warm/30"
            aria-label={`${selectedAgents.length} of ${MAX_AGENTS_PER_DEBATE} selected`}
          >
            {selectedAgents.length} / {MAX_AGENTS_PER_DEBATE}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {AGENTS.map((agent) => {
          const hasApiKey = hasKey(agent);
          const isSelected = selectedAgents.includes(agent.id);
          const atLimit = selectedAgents.length >= MAX_AGENTS_PER_DEBATE;
          const isDisabled = !hasApiKey || (!isSelected && atLimit);

          let statusLabel = "Available";
          if (agent.free) statusLabel = "Free";
          else if (!hasApiKey) statusLabel = "API key required";
          else if (!isSelected && atLimit) statusLabel = "Agent limit reached";

          return (
            <button
              key={agent.id}
              onClick={() => {
                if (isDisabled) return;
                toggleAgent(agent.id);
              }}
              disabled={isDisabled}
              aria-label={`${agent.name} - ${statusLabel}`}
              aria-pressed={isSelected}
              className={cn(
                "relative w-full rounded-[10px] border p-3.5 text-left transition-all",
                isSelected
                  ? "border-warm/40 bg-warm/12"
                  : "border-white/[0.08] bg-bg-1 hover:border-white/[0.18] hover:bg-bg-2",
                isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer hover:-translate-y-[1px]",
              )}
            >
              {isSelected && (
                <span className="absolute -top-px left-0 h-px w-full bg-warm" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        "font-display text-[15px] tracking-[-0.01em] truncate",
                        isSelected ? "text-warm italic" : "text-ink-primary",
                      )}
                    >
                      {agent.name}
                    </p>
                    {agent.free && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-agree bg-agree/14 border border-agree/30 rounded-full px-1.5 py-0.5 leading-none">
                        Free
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">
                    {agent.provider}
                  </p>
                </div>
                {hasApiKey ? (
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "text-warm" : "text-agree",
                    )}
                  />
                ) : (
                  <Lock className="h-4 w-4 text-ink-muted shrink-0" />
                )}
              </div>
              {!hasApiKey && !agent.free && (
                <p className="text-[11px] text-ink-tertiary mt-2">
                  <Link
                    href="/settings"
                    className="text-warm hover:text-warm-bright transition-colors"
                  >
                    Configure API key →
                  </Link>
                </p>
              )}
            </button>
          );
        })}
      </div>

      {selectedAgents.length < MIN_AGENTS_PER_DEBATE && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-bg-2 px-3 py-2.5 text-[12px] text-ink-tertiary">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warm" />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]">
            Select at least {MIN_AGENTS_PER_DEBATE} members to start
          </span>
        </div>
      )}
      {selectedAgents.length >= MAX_AGENTS_PER_DEBATE && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-bg-2 px-3 py-2.5 text-[12px] text-ink-tertiary">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warm" />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]">
            Maximum {MAX_AGENTS_PER_DEBATE} members per deliberation
          </span>
        </div>
      )}
    </div>
  );
}
