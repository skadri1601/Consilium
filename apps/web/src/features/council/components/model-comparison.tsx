"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import {
  Columns2,
  List,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { getAgentDisplayName } from "../utils/council-helpers";

interface Claim {
  text: string;
  supported: boolean;
}

interface ModelResponse {
  modelId: string;
  content: string;
  confidence: number;
  claims: Claim[];
}

interface DiffSection {
  type: "same" | "different";
  leftText: string;
  rightText: string;
}

interface ModelComparisonProps {
  responses: ModelResponse[];
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function computeDiffSections(left: string, right: string): DiffSection[] {
  const leftSentences = extractSentences(left);
  const rightSentences = extractSentences(right);
  const sections: DiffSection[] = [];
  const maxLen = Math.max(leftSentences.length, rightSentences.length);

  for (let i = 0; i < maxLen; i++) {
    const l = leftSentences[i] || "";
    const r = rightSentences[i] || "";
    const similarity = computeSimilarity(l, r);

    sections.push({
      type: similarity > 0.6 ? "same" : "different",
      leftText: l,
      rightText: r,
    });
  }

  return sections;
}

function computeSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence > 0.7 ? "bg-agree" : confidence > 0.4 ? "bg-warm" : "bg-dissent";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 rounded-full bg-bg-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

export function ModelComparison({ responses }: ModelComparisonProps) {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(
    Math.min(1, responses.length - 1),
  );
  const [showClaims, setShowClaims] = useState(true);
  const [viewMode, setViewMode] = useState<"split" | "list">("split");

  const left = responses[leftIndex];
  const right = responses[rightIndex];

  const diffSections = useMemo(
    () =>
      left && right ? computeDiffSections(left.content, right.content) : [],
    [left, right],
  );

  if (responses.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Columns2 className="h-4 w-4 text-warm" />
            <div>
              <div className="eyebrow">Side by side</div>
              <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
                Model comparison
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-[10px] border border-white/[0.08] bg-bg-1 p-1">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              aria-pressed={viewMode === "split"}
              className={cn(
                "h-7 px-2 rounded-[6px] flex items-center justify-center transition-colors",
                viewMode === "split"
                  ? "bg-warm/14 text-warm"
                  : "text-ink-tertiary hover:text-ink-primary",
              )}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={cn(
                "h-7 px-2 rounded-[6px] flex items-center justify-center transition-colors",
                viewMode === "list"
                  ? "bg-warm/14 text-warm"
                  : "text-ink-tertiary hover:text-ink-primary",
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <select
              value={leftIndex}
              onChange={(e) => setLeftIndex(Number(e.target.value))}
              className="w-full rounded-[10px] border border-white/[0.08] bg-bg-1 px-3 py-2 text-[13px] text-ink-primary focus-visible:outline-none focus-visible:border-warm/40"
              aria-label="Select left model"
            >
              {responses.map((r, i) => (
                <option key={r.modelId} value={i}>
                  {getAgentDisplayName(r.modelId)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={rightIndex}
              onChange={(e) => setRightIndex(Number(e.target.value))}
              className="w-full rounded-[10px] border border-white/[0.08] bg-bg-1 px-3 py-2 text-[13px] text-ink-primary focus-visible:outline-none focus-visible:border-warm/40"
              aria-label="Select right model"
            >
              {responses.map((r, i) => (
                <option key={r.modelId} value={i}>
                  {getAgentDisplayName(r.modelId)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {left && right && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
                  Confidence
                </p>
                <ConfidenceBar confidence={left.confidence} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
                  Confidence
                </p>
                <ConfidenceBar confidence={right.confidence} />
              </div>
            </div>

            {viewMode === "split" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3 text-[13px] leading-[1.6] text-ink-secondary max-h-[400px] overflow-y-auto">
                  {diffSections.map((section, i) => (
                    <span
                      key={i}
                      className={cn(
                        section.type === "different" &&
                          "bg-warm/12 text-ink-primary rounded px-0.5",
                      )}
                    >
                      {section.leftText}{" "}
                    </span>
                  ))}
                </div>
                <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3 text-[13px] leading-[1.6] text-ink-secondary max-h-[400px] overflow-y-auto">
                  {diffSections.map((section, i) => (
                    <span
                      key={i}
                      className={cn(
                        section.type === "different" &&
                          "bg-agree/12 text-ink-primary rounded px-0.5",
                      )}
                    >
                      {section.rightText}{" "}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {diffSections.map((section, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-[10px] border p-3",
                      section.type === "different"
                        ? "border-warm/30 bg-warm/6"
                        : "border-white/[0.06] bg-bg-1",
                    )}
                  >
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <p className="text-ink-secondary">{section.leftText}</p>
                      <p className="text-ink-secondary">{section.rightText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setShowClaims(!showClaims)}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Claims extracted
                {showClaims ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <AnimatePresence>
                {showClaims && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mb-2">
                          {getAgentDisplayName(left.modelId)}
                        </p>
                        {left.claims.length > 0 ? (
                          left.claims.map((claim, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-[8px] border px-2.5 py-1.5 text-[12px]",
                                claim.supported
                                  ? "border-agree/30 bg-agree/8 text-ink-primary"
                                  : "border-dissent/30 bg-dissent/8 text-ink-primary",
                              )}
                            >
                              {claim.text}
                            </div>
                          ))
                        ) : (
                          <p className="text-[12px] text-ink-tertiary">
                            No claims extracted
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mb-2">
                          {getAgentDisplayName(right.modelId)}
                        </p>
                        {right.claims.length > 0 ? (
                          right.claims.map((claim, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-[8px] border px-2.5 py-1.5 text-[12px]",
                                claim.supported
                                  ? "border-agree/30 bg-agree/8 text-ink-primary"
                                  : "border-dissent/30 bg-dissent/8 text-ink-primary",
                              )}
                            >
                              {claim.text}
                            </div>
                          ))
                        ) : (
                          <p className="text-[12px] text-ink-tertiary">
                            No claims extracted
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
