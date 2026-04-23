"use client";

import { useState, useEffect, useCallback } from "react";
import { AGENTS } from "@/shared/lib/constants";
import { AgentCard } from "./agent-card";
import { cn } from "@/shared/lib/utils";
import type { AgentDef, AgentProvider } from "../types/agents.types";

const PROVIDER_ORDER: AgentProvider[] = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Groq",
  "XAI",
];

function groupByProvider(
  agents: readonly AgentDef[],
): Record<string, AgentDef[]> {
  const groups: Record<string, AgentDef[]> = {};
  for (const agent of agents) {
    if (!groups[agent.provider]) {
      groups[agent.provider] = [];
    }
    groups[agent.provider].push(agent);
  }
  return groups;
}

interface ConfiguredKeys {
  openaiKey: string | null;
  anthropicKey: string | null;
  googleKey: string | null;
  groqKey: string | null;
  xaiKey: string | null;
}

const PROVIDER_KEY_MAP: Record<AgentProvider, keyof ConfiguredKeys> = {
  OpenAI: "openaiKey",
  Anthropic: "anthropicKey",
  Google: "googleKey",
  Groq: "groqKey",
  XAI: "xaiKey",
};

export function AgentList() {
  const [configuredKeys, setConfiguredKeys] = useState<ConfiguredKeys>({
    openaiKey: null,
    anthropicKey: null,
    googleKey: null,
    groqKey: null,
    xaiKey: null,
  });

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      setConfiguredKeys({
        openaiKey: data.openaiKey ?? null,
        anthropicKey: data.anthropicKey ?? null,
        googleKey: data.googleKey ?? null,
        groqKey: data.groqKey ?? null,
        xaiKey: data.xaiKey ?? null,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const grouped = groupByProvider(AGENTS);

  return (
    <div className="space-y-8">
      {PROVIDER_ORDER.map((provider) => {
        const agents = grouped[provider];
        if (!agents || agents.length === 0) return null;
        const keyField = PROVIDER_KEY_MAP[provider];
        const hasKey = configuredKeys[keyField] !== null;

        return (
          <section key={provider}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="eyebrow">Provider</div>
                <h2 className="font-display text-[24px] tracking-[-0.02em] text-ink-primary mt-1 font-light">
                  {provider}
                </h2>
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border",
                  hasKey
                    ? "bg-agree/14 text-agree border-agree/30"
                    : "bg-bg-2 text-ink-tertiary border-white/[0.08]",
                )}
              >
                {hasKey ? "Key configured" : "Key missing"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} hasApiKey={hasKey} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
