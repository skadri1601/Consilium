"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConsensusViewProps {
  responses: {
    agentId: string;
    agentName: string;
    content: string;
  }[];
  consensusScore?: number;
}

export function ConsensusView({ responses, consensusScore }: ConsensusViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Consensus Analysis</span>
          {consensusScore !== undefined && (
            <span className="text-sm font-normal text-muted-foreground">
              Agreement: {Math.round(consensusScore * 100)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <p className="text-muted-foreground">
            Submit a query to see consensus analysis
          </p>
        ) : (
          <div className="space-y-4">
            {/* TODO: Implement semantic similarity visualization */}
            <p className="text-sm text-muted-foreground">
              Analyzing {responses.length} responses for consensus...
            </p>
            <div className="space-y-2">
              {responses.map((response) => (
                <div
                  key={response.agentId}
                  className="rounded-lg border p-3"
                >
                  <p className="font-medium">{response.agentName}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {response.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
