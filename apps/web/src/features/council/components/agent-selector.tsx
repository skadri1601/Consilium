"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCouncilStore } from "../store/council.store";
import { AGENTS } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";

export function AgentSelector() {
  const { selectedAgents, toggleAgent } = useCouncilStore();

  return (
    <Card className="w-64 shrink-0">
      <CardHeader>
        <CardTitle className="text-lg">Select Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => toggleAgent(agent.id)}
            className={cn(
              "w-full rounded-lg border p-3 text-left transition-colors",
              selectedAgents.includes(agent.id)
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-accent"
            )}
          >
            <p className="font-medium">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.provider}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
