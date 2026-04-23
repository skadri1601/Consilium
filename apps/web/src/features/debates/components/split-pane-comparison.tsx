"use client";

import { useState, useMemo } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
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

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
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
  allOtherOutputs: string[][],
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

function AnnotatedText({
  annotations,
}: Readonly<{ annotations: SentenceAnnotation[] }>) {
  return (
    <div className="text-[13px] leading-[1.7] whitespace-pre-wrap text-ink-secondary">
      {annotations.map((a, i) => (
        <span
          key={`${a.agreement}-${a.text.slice(0, 48)}-${i}`}
          className={cn(
            "rounded-sm px-0.5",
            a.agreement === "agree" && "bg-agree/14 text-ink-primary",
            a.agreement === "disagree" && "bg-dissent/14 text-ink-primary",
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
}: Readonly<{
  output: ModelOutput;
  annotations: SentenceAnnotation[];
  modelCount: number;
}>) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col h-full p-0",
        modelCount <= 2 && "min-w-0 flex-1",
        modelCount === 3 && "min-w-0 flex-1",
        modelCount >= 4 && "min-w-0 flex-1",
      )}
    >
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-warm shrink-0" />
          <span className="font-display text-[14px] tracking-[-0.01em] text-ink-primary truncate">
            {output.modelName}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-tertiary border border-white/[0.08] rounded-full px-2 py-0.5">
            {output.provider}
          </span>
        </div>
      </div>
      <div className="flex-1 px-4 pb-4 pt-3">
        <ScrollArea className="h-full max-h-[60vh]">
          <AnnotatedText annotations={annotations} />
        </ScrollArea>
      </div>
    </div>
  );
}

function AgreementLegend() {
  return (
    <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-agree/20 border border-agree/30" />
        <span>Agreement</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-dissent/20 border border-dissent/30" />
        <span>Disagreement</span>
      </div>
    </div>
  );
}

export function SplitPaneComparison({
  phases,
  defaultPhase,
}: Readonly<SplitPaneComparisonProps>) {
  const initialPhase = defaultPhase ?? phases[0]?.phase ?? "proposal";
  const [activePhase, setActivePhase] = useState<string>(initialPhase);

  const annotationsMap = useMemo(() => {
    const map: Record<string, SentenceAnnotation[][]> = {};

    for (const phase of phases) {
      const sentencesByModel = phase.outputs.map((o) =>
        splitIntoSentences(o.content),
      );
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
      <div className="surface-card p-6 text-[13px] text-ink-tertiary text-center">
        No phase data available for comparison.
      </div>
    );
  }

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
                  count >= 5 &&
                    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
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
