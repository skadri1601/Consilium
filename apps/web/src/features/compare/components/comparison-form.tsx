"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AGENTS } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { Loader2, ArrowRightLeft, CheckCircle2 } from "lucide-react";

export function ComparisonForm() {
  const router = useRouter();
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [context, setContext] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "gemini-2.0-flash",
    "llama-3.1-8b-instant",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModel(id: string) {
    setSelectedModels((prev) => {
      if (prev.includes(id)) {
        return prev.length <= 2 ? prev : prev.filter((m) => m !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!optionA.trim() || !optionB.trim() || selectedModels.length < 2) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/debates/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          context: context.trim(),
          models: selectedModels,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to start comparison");
      }

      const { debateId } = await res.json();
      router.push(`/debates/${debateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const canSubmit =
    optionA.trim().length > 0 &&
    optionB.trim().length > 0 &&
    selectedModels.length >= 2 &&
    !submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-stretch gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Option A</label>
          <Textarea
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            placeholder="e.g. Redis"
            disabled={submitting}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex items-center justify-center pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/10">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Option B</label>
          <Textarea
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            placeholder="e.g. PostgreSQL"
            disabled={submitting}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Context</label>
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="What's the use case or context? (optional)"
          disabled={submitting}
          className="min-h-[80px] resize-none"
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-3">
            Models{" "}
            <span className="text-muted-foreground font-normal">
              ({selectedModels.length} selected, min 2)
            </span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {AGENTS.map((agent) => {
              const isSelected = selectedModels.includes(agent.id);
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleModel(agent.id)}
                  disabled={submitting}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className="truncate">{agent.name}</span>
                  {isSelected && <CheckCircle2 className="h-3 w-3 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Starting...
          </>
        ) : (
          "Start Comparison Debate"
        )}
      </Button>
    </form>
  );
}
