"use client";

import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { AgentResponse } from "../types/council.types";

interface BlindEvaluationProps {
  responses: AgentResponse[];
  onSelect: (responseId: string) => void;
  revealModels?: boolean;
}

export function BlindEvaluation({
  responses,
  onSelect,
  revealModels = false,
}: BlindEvaluationProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(revealModels);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Compare Responses</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRevealed(!isRevealed)}
        >
          {isRevealed ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Models
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Reveal Models
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responses.map((response, index) => (
          <Card
            key={response.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedId === response.id && "ring-2 ring-primary"
            )}
            onClick={() => handleSelect(response.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  {isRevealed ? response.agentName : `Response ${index + 1}`}
                </span>
                {selectedId === response.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-6">
                {response.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
