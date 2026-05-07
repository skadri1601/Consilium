"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Columns2,
  List,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import {
  getAgentDisplayName,
  getProviderStyles,
} from "../utils/council-helpers";

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
    confidence > 0.7
      ? "bg-green-500"
      : confidence > 0.4
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium w-8 text-right">
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
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Columns2 className="h-5 w-5 text-blue-500" />
              Model Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "split" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("split")}
                className="h-7 px-2"
              >
                <Columns2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 px-2"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <select
                value={leftIndex}
                onChange={(e) => setLeftIndex(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <p className="text-xs text-muted-foreground mb-1">
                    Confidence
                  </p>
                  <ConfidenceBar confidence={left.confidence} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Confidence
                  </p>
                  <ConfidenceBar confidence={right.confidence} />
                </div>
              </div>

              {viewMode === "split" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-sm leading-relaxed max-h-[400px] overflow-y-auto",
                      getProviderStyles(left.modelId, "thinking"),
                    )}
                  >
                    {diffSections.map((section, i) => (
                      <span
                        key={i}
                        className={cn(
                          section.type === "different" &&
                            "bg-red-100 dark:bg-red-900/30 rounded px-0.5",
                        )}
                      >
                        {section.leftText}{" "}
                      </span>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-sm leading-relaxed max-h-[400px] overflow-y-auto",
                      getProviderStyles(right.modelId, "thinking"),
                    )}
                  >
                    {diffSections.map((section, i) => (
                      <span
                        key={i}
                        className={cn(
                          section.type === "different" &&
                            "bg-blue-100 dark:bg-blue-900/30 rounded px-0.5",
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
                        "rounded-lg border p-3",
                        section.type === "different"
                          ? "border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/10"
                          : "border-border bg-muted/20",
                      )}
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <p className="text-muted-foreground">
                          {section.leftText}
                        </p>
                        <p className="text-muted-foreground">
                          {section.rightText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => setShowClaims(!showClaims)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  Claims Extracted
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
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            {getAgentDisplayName(left.modelId)}
                          </p>
                          {left.claims.length > 0 ? (
                            left.claims.map((claim, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded border px-2.5 py-1.5 text-xs",
                                  claim.supported
                                    ? "border-green-300/50 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                    : "border-red-300/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
                                )}
                              >
                                {claim.text}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No claims extracted
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            {getAgentDisplayName(right.modelId)}
                          </p>
                          {right.claims.length > 0 ? (
                            right.claims.map((claim, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded border px-2.5 py-1.5 text-xs",
                                  claim.supported
                                    ? "border-green-300/50 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                    : "border-red-300/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
                                )}
                              >
                                {claim.text}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
