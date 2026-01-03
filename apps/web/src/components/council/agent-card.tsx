"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    provider: string;
    status?: "ready" | "loading" | "error";
  };
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
        {agent.status && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                agent.status === "ready" && "bg-green-500",
                agent.status === "loading" && "bg-yellow-500",
                agent.status === "error" && "bg-red-500"
              )}
            />
            <span className="text-xs capitalize text-muted-foreground">
              {agent.status}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
