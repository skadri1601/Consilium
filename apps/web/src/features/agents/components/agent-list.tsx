"use client";

import { AgentCard } from "./agent-card";
import { useAgents } from "../hooks/use-agents";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function AgentList() {
  const { agents, isLoading, error } = useAgents();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load agents: {error}
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No agents configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
