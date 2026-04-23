"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { AgentDef } from "../types/agents.types";

interface AgentCardProps {
  agent: AgentDef;
  hasApiKey: boolean;
}

export function AgentCard({ agent, hasApiKey }: AgentCardProps) {
  const available = agent.free || hasApiKey;

  return (
    <div className="surface-card p-5 transition-all hover:-translate-y-[1px] hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display text-[17px] tracking-[-0.01em] text-ink-primary truncate">
          {agent.name}
        </h3>
        <span
          className={cn(
            "rounded-full border font-mono text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 shrink-0",
            agent.free
              ? "bg-agree/14 text-agree border-agree/30"
              : "bg-warm/12 text-warm border-warm/30",
          )}
        >
          {agent.free ? "Free" : "Paid"}
        </span>
      </div>
      <p className="text-[13px] text-ink-secondary leading-[1.55] mb-3">
        {agent.description}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mb-4 truncate">
        {agent.id}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              available ? "bg-agree" : "bg-ink-muted",
            )}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            {available ? "Available" : "API key required"}
          </span>
        </div>
        {!available && (
          <Link
            href="/settings#/api-keys"
            className="btn-consilium btn-consilium-ghost h-7 px-2 text-[11px]"
          >
            <Settings className="h-3 w-3" />
            Configure
          </Link>
        )}
      </div>
    </div>
  );
}
