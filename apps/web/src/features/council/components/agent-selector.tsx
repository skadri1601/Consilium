"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCouncilStore } from "../store/council.store";
import { AGENTS } from "@/shared/lib/constants";
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
  }>({
    openaiKey: null,
    anthropicKey: null,
    googleKey: null,
    groqKey: null,
  });

  useEffect(() => {
    // Fetch API key status
    fetch("/api/api-keys")
      .then((res) => {
        if (!res.ok) {
          // If error, just log and continue - agents will show as unavailable
          console.warn("Failed to fetch API keys:", res.status);
          return { openaiKey: null, anthropicKey: null, googleKey: null, groqKey: null };
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
          });
        }
      })
      .catch((error) => {
        // Ignore errors - will show as unavailable
        console.warn("Error fetching API keys:", error);
      });
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
      default:
        return null;
    }
  };

  const hasKey = (agent: (typeof AGENTS)[number]) => {
    const key = getProviderKey(agent.provider);
    return key !== null;
  };

  return (
    <Card className="w-full max-w-sm shrink-0" variant="default">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Agents</CardTitle>
          {selectedAgents.length > 0 && (
            <span
              className="rounded-full bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5"
              aria-label={`${selectedAgents.length} selected`}
            >
              {selectedAgents.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {AGENTS.map((agent) => {
          const hasApiKey = hasKey(agent);
          const isSelected = selectedAgents.includes(agent.id);

          return (
            <button
              key={agent.id}
              onClick={() => {
                if (!hasApiKey) {
                  // Could show a tooltip or modal here
                  return;
                }
                toggleAgent(agent.id);
              }}
              disabled={!hasApiKey}
              aria-label={`${agent.name} - ${hasApiKey ? "Available" : "API key required"}`}
              aria-pressed={isSelected}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors relative",
                !hasApiKey && "opacity-50 cursor-not-allowed",
                isSelected && hasApiKey
                  ? "border-primary bg-primary/10"
                  : hasApiKey
                  ? "border-border hover:bg-accent"
                  : "border-border bg-muted"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.provider}</p>
                </div>
                {hasApiKey ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 ml-2" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                )}
              </div>
              {!hasApiKey && (
                <p className="text-xs text-muted-foreground mt-1">
                  <Link href="/settings" className="text-primary hover:underline">
                    Configure API key
                  </Link>
                </p>
              )}
            </button>
          );
        })}
        </div>
        {selectedAgents.length === 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Select at least one agent to start a debate
          </div>
        )}
      </CardContent>
    </Card>
  );
}
