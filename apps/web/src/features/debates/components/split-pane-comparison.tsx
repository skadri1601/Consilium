"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

type Phase = "proposal" | "rebuttal" | "final";

interface ModelOutput {
  modelId: string;
  modelName: string;
  provider: string;
  content: string;
}

interface PhaseData {
  phase: Phase;
  label: string;
  outputs: ModelOutput[];
}

interface SplitPaneComparisonProps {
  phases: PhaseData[];
  defaultPhase?: Phase;
}

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  openai: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/30" },
  anthropic: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/30" },
  google: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/30" },
  groq: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/30" },
  xai: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-500/30" },
};

const PROVIDER_DOT_COLORS: Record<string, string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-orange-500",
  google: "bg-blue-500",
  groq: "bg-purple-500",
  xai: "bg-rose-500",
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeSentenceSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" "));
  const wordsB = new Set(normalizeText(b).split(" "));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

const AGREEMENT_THRESHOLD = 0.4;

interface SentenceAnnotation {
  text: string;
  agreement: "agree" | "disagree" | "neutral";
}

function annotateSentences(
  sentences: string[],
  allOtherOutputs: string[][]
): SentenceAnnotation[] {
  return sentences.map((sentence) => {
    if (sentence.trim().length < 10) {
      return { text: sentence, agreement: "neutral" };
    }

    let maxSim = 0;
    for (const otherSentences of allOtherOutputs) {
      for (const other of otherSentences) {
        const sim = computeSentenceSimilarity(sentence, other);
        if (sim > maxSim) maxSim = sim;
      }
    }

    if (maxSim >= AGREEMENT_THRESHOLD) {
      return { text: sentence, agreement: "agree" };
    }
    return { text: sentence, agreement: "disagree" };
  });
}

function AnnotatedText({ annotations }: { annotations: SentenceAnnotation[] }) {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {annotations.map((a, i) => (
        <span
          key={i}
          className={cn(
            "rounded-sm px-0.5",
            a.agreement === "agree" && "bg-emerald-500/15 dark:bg-emerald-500/20",
            a.agreement === "disagree" && "bg-red-500/15 dark:bg-red-500/20"
          )}
        >
          {a.text}{" "}
        </span>
      ))}
    </div>
  );
}

function ModelPane({
  output,
  annotations,
  modelCount,
}: {
  output: ModelOutput;
  annotations: SentenceAnnotation[];
  modelCount: number;
}) {
  const providerKey = output.provider.toLowerCase();
  const colors = PROVIDER_COLORS[providerKey] ?? PROVIDER_COLORS.openai;
  const dotColor = PROVIDER_DOT_COLORS[providerKey] ?? "bg-gray-500";

  return (
    <Card
      className={cn(
        "flex flex-col h-full",
        modelCount <= 2 && "min-w-0 flex-1",
        modelCount === 3 && "min-w-0 flex-1",
        modelCount >= 4 && "min-w-0 flex-1"
      )}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
          <span className="text-sm font-semibold truncate">{output.modelName}</span>
          <Badge
            variant="outline"
            className={cn("ml-auto shrink-0 text-[10px] px-1.5 py-0", colors.bg, colors.text, colors.border)}
          >
            {output.provider}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4">
        <ScrollArea className="h-full max-h-[60vh]">
          <AnnotatedText annotations={annotations} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AgreementLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
        <span>Agreement</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-red-500/20 border border-red-500/30" />
        <span>Disagreement</span>
      </div>
    </div>
  );
}

export function SplitPaneComparison({ phases, defaultPhase }: SplitPaneComparisonProps) {
  const initialPhase = defaultPhase ?? phases[0]?.phase ?? "proposal";
  const [activePhase, setActivePhase] = useState<string>(initialPhase);

  const annotationsMap = useMemo(() => {
    const map: Record<string, SentenceAnnotation[][]> = {};

    for (const phase of phases) {
      const sentencesByModel = phase.outputs.map((o) => splitIntoSentences(o.content));
      const annotated = phase.outputs.map((_, idx) => {
        const otherSentences = sentencesByModel.filter((_, j) => j !== idx);
        return annotateSentences(sentencesByModel[idx], otherSentences);
      });
      map[phase.phase] = annotated;
    }

    return map;
  }, [phases]);

  if (phases.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No phase data available for comparison.
      </div>
    );
  }

  const currentPhase = phases.find((p) => p.phase === activePhase) ?? phases[0];
  const currentAnnotations = annotationsMap[currentPhase.phase] ?? [];
  const modelCount = currentPhase.outputs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={activePhase} onValueChange={setActivePhase}>
          <TabsList>
            {phases.map((p) => (
              <TabsTrigger key={p.phase} value={p.phase}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <AgreementLegend />
      </div>

      <Tabs value={activePhase} onValueChange={setActivePhase}>
        {phases.map((phase) => {
          const phaseAnnotations = annotationsMap[phase.phase] ?? [];
          const count = phase.outputs.length;

          return (
            <TabsContent key={phase.phase} value={phase.phase}>
              <div
                className={cn(
                  "grid gap-4",
                  count <= 1 && "grid-cols-1",
                  count === 2 && "grid-cols-1 md:grid-cols-2",
                  count === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                  count === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
                  count >= 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                )}
              >
                {phase.outputs.map((output, idx) => (
                  <ModelPane
                    key={output.modelId}
                    output={output}
                    annotations={phaseAnnotations[idx] ?? []}
                    modelCount={count}
                  />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export type { Phase, ModelOutput, PhaseData, SplitPaneComparisonProps };
