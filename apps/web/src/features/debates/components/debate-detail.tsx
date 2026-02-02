"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { SynthesisOutput } from "@/components/council/synthesis-output";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface DebateDetail {
  id: string;
  topic: string;
  status: string;
  modelsUsed: string[];
  totalCost: number;
  goldenPrompt: string | null;
  createdAt: string;
  rounds: Array<{
    id: string;
    roundNumber: number;
    status: string;
    messages: Array<{
      id: string;
      agentId: string;
      modelUsed: string;
      content: string;
      cost: number;
      latencyMs: number;
    }>;
  }>;
}

export function DebateDetail({ debateId }: { debateId: string }) {
  const [debate, setDebate] = useState<DebateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebate();
  }, [debateId]);

  const fetchDebate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debates/${debateId}`);
      if (response.ok) {
        const data = await response.json();
        setDebate(data);
      }
    } catch (error) {
      console.error("Failed to fetch debate:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading debate...</span>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Debate not found</p>
            <Button asChild className="mt-4">
              <Link href="/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/history">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">{debate.topic}</h1>
        <p className="text-muted-foreground">
          {new Date(debate.createdAt).toLocaleString()} • {debate.status}
        </p>
      </div>

      {/* Rounds */}
      <div className="space-y-6 mb-6">
        {debate.rounds.map((round) => (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle>Round {round.roundNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {round.messages.map((message) => (
                  <div key={message.id} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{message.modelUsed}</span>
                      <span className="text-sm text-muted-foreground">
                        {message.latencyMs}ms • ${message.cost.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Synthesis */}
      {debate.goldenPrompt && (
        <SynthesisOutput
          prompt={debate.goldenPrompt}
          cost={debate.totalCost}
          modelsUsed={debate.modelsUsed}
        />
      )}
    </div>
  );
}

