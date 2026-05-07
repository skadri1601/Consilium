"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useCouncilStore } from "../store/council.store";
import {
  AGENTS,
  MIN_AGENTS_PER_DEBATE,
  MAX_AGENTS_PER_DEBATE,
} from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { CheckCircle2, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export function AgentSelector() {
  const { selectedAgents, toggleAgent } = useCouncilStore();
  const [apiKeys, setApiKeys] = useState<{
    openaiKey: string | null;
    anthropicKey: string | null;
    googleKey: string | null;
    groqKey: string | null;
    xaiKey: string | null;
    moonshotKey: string | null;
    openrouterKey: string | null;
  }>({
    openaiKey: null,
    anthropicKey: null,
    googleKey: null,
    groqKey: null,
    xaiKey: null,
    moonshotKey: null,
    openrouterKey: null,
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
            moonshotKey: null,
            openrouterKey: null,
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
            moonshotKey: data.moonshotKey || null,
            openrouterKey: data.openrouterKey || null,
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
      case "moonshot":
        return apiKeys.moonshotKey;
      case "openrouter":
        return apiKeys.openrouterKey;
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
    <Card className="w-full shrink-0" variant="default">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Agents</CardTitle>
          {selectedAgents.length > 0 && (
            <span
              className="rounded-full bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5"
              aria-label={`${selectedAgents.length} of ${MAX_AGENTS_PER_DEBATE} selected`}
            >
              {selectedAgents.length}/{MAX_AGENTS_PER_DEBATE}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {AGENTS.map((agent) => {
            const hasApiKey = hasKey(agent);
            const isSelected = selectedAgents.includes(agent.id);
            const atLimit = selectedAgents.length >= MAX_AGENTS_PER_DEBATE;
            const isDisabled = !hasApiKey || (!isSelected && atLimit);

            let statusLabel = "Available";
            if (agent.free) statusLabel = "Free";
            else if (!hasApiKey) statusLabel = "API key required";
            else if (!isSelected && atLimit)
              statusLabel = "Agent limit reached";

            let borderStyle = "border-transparent bg-muted/30";
            if (isSelected) borderStyle = "border-primary bg-primary/10";
            else if (agent.free && !isDisabled)
              borderStyle =
                "border-green-500/40 hover:bg-green-50 dark:hover:bg-green-950/20";
            else if (!isDisabled) borderStyle = "border-border hover:bg-accent";

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
                  "w-full rounded-lg border p-3 text-left transition-colors relative",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  borderStyle,
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">{agent.name}</p>
                      {agent.free && (
                        <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {agent.provider}
                    </p>
                  </div>
                  {agent.free ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 ml-2" />
                  ) : hasApiKey ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 ml-2" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  )}
                </div>
                {!hasApiKey && !agent.free && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link
                      href="/settings"
                      className="text-primary hover:underline"
                    >
                      Configure API key
                    </Link>
                  </p>
                )}
              </button>
            );
          })}
        </div>
        {selectedAgents.length < MIN_AGENTS_PER_DEBATE && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Select at least {MIN_AGENTS_PER_DEBATE} agents to start a debate
          </div>
        )}
        {selectedAgents.length >= MAX_AGENTS_PER_DEBATE && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Maximum {MAX_AGENTS_PER_DEBATE} agents per debate
          </div>
        )}
      </CardContent>
    </Card>
  );
}
