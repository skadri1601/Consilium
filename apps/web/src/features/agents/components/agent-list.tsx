"use client";

import { useState, useEffect, useCallback } from "react";
import { AGENTS } from "@/shared/lib/constants";
import { AgentCard } from "./agent-card";
import type { AgentDef, AgentProvider } from "../types/agents.types";

const PROVIDER_ORDER: AgentProvider[] = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Groq",
  "xAI",
  "Moonshot",
  "OpenRouter",
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
  moonshotKey: string | null;
  openrouterKey: string | null;
}

const PROVIDER_KEY_MAP: Record<AgentProvider, keyof ConfiguredKeys> = {
  OpenAI: "openaiKey",
  Anthropic: "anthropicKey",
  Google: "googleKey",
  Groq: "groqKey",
  xAI: "xaiKey",
  Moonshot: "moonshotKey",
  OpenRouter: "openrouterKey",
};

export function AgentList() {
  const [configuredKeys, setConfiguredKeys] = useState<ConfiguredKeys>({
    openaiKey: null,
    anthropicKey: null,
    googleKey: null,
    groqKey: null,
    xaiKey: null,
    moonshotKey: null,
    openrouterKey: null,
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
        moonshotKey: data.moonshotKey ?? null,
        openrouterKey: data.openrouterKey ?? null,
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
            <h2 className="mb-4 text-lg font-semibold">{provider}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
