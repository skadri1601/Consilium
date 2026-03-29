"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              agent.free
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
            )}
          >
            {agent.free ? "Free" : "Paid"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{agent.description}</p>
        <p className="font-mono text-xs text-muted-foreground">{agent.id}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                available ? "bg-green-500" : "bg-gray-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {available ? "Available" : "API key required"}
            </span>
          </div>
          {!available && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings#/api-keys">
                <Settings className="mr-1 h-3 w-3" />
                Configure
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
