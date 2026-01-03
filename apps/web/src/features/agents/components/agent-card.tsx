"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { Agent } from "../types/agents.types";

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors",
        isSelected && "border-primary bg-primary/5",
        onClick && "hover:bg-accent"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{agent.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{agent.provider}</p>
        {agent.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              agent.isActive ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {agent.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
