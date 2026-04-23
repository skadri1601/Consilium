"use client";

import { motion } from "framer-motion";
import { Scale, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { getAgentDisplayName } from "../utils/council-helpers";

interface DissentPoint {
  topic: string;
  majorityPosition: string;
  minorityPosition: string;
  significance: "low" | "medium" | "high";
}

interface OpinionHolder {
  modelId: string;
  summary: string;
  confidence: number;
  keyPoints: string[];
}

interface DissentReport {
  majority: OpinionHolder[];
  minority: OpinionHolder[];
  disagreements: DissentPoint[];
  consensusAreas: string[];
}

interface DissentViewProps {
  report: DissentReport;
}

function SignificanceBadge({ level }: { level: DissentPoint["significance"] }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border",
        level === "high" && "bg-dissent/14 text-dissent border-dissent/30",
        level === "medium" && "bg-warm/12 text-warm border-warm/30",
        level === "low" && "bg-agree/14 text-agree border-agree/30",
      )}
    >
      {level}
    </span>
  );
}

function OpinionCard({
  holder,
  variant,
}: {
  holder: OpinionHolder;
  variant: "majority" | "minority";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[10px] border p-4",
        variant === "majority"
          ? "border-agree/30 bg-agree/6"
          : "border-dissent/30 bg-dissent/6",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-[14px] tracking-[-0.01em] text-ink-primary truncate">
          {getAgentDisplayName(holder.modelId)}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-12 rounded-full bg-bg-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                variant === "majority" ? "bg-agree" : "bg-dissent",
              )}
              style={{ width: `${holder.confidence * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
            {(holder.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-[13px] text-ink-secondary mb-3 leading-[1.55]">
        {holder.summary}
      </p>
      <ul className="space-y-1">
        {holder.keyPoints.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12px] text-ink-tertiary"
          >
            <span className="mt-1.5 h-1 w-1 rounded-full bg-ink-muted shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function DissentView({ report }: DissentViewProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <Scale className="h-4 w-4 text-warm" />
        <div>
          <div className="eyebrow">Minority report</div>
          <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
            Dissent analysis
          </h3>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-agree" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-secondary">
                Majority opinion ({report.majority.length})
              </span>
            </div>
            <div className="space-y-3">
              {report.majority.map((holder) => (
                <OpinionCard
                  key={holder.modelId}
                  holder={holder}
                  variant="majority"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-dissent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-secondary">
                Dissenting opinion{report.minority.length !== 1 ? "s" : ""} (
                {report.minority.length})
              </span>
            </div>
            <div className="space-y-3">
              {report.minority.map((holder) => (
                <OpinionCard
                  key={holder.modelId}
                  holder={holder}
                  variant="minority"
                />
              ))}
            </div>
          </div>
        </div>

        {report.disagreements.length > 0 && (
          <div>
            <div className="eyebrow mb-3">Key disagreements</div>
            <div className="space-y-3">
              {report.disagreements.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-[14px] tracking-[-0.01em] text-ink-primary">
                      {point.topic}
                    </span>
                    <SignificanceBadge level={point.significance} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-[8px] border border-agree/20 bg-agree/6 p-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-agree">
                        Majority
                      </span>
                      <p className="text-[12px] text-ink-secondary mt-1 leading-[1.5]">
                        {point.majorityPosition}
                      </p>
                    </div>
                    <div className="rounded-[8px] border border-dissent/20 bg-dissent/6 p-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-dissent">
                        Dissent
                      </span>
                      <p className="text-[12px] text-ink-secondary mt-1 leading-[1.5]">
                        {point.minorityPosition}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {report.consensusAreas.length > 0 && (
          <div>
            <div className="eyebrow mb-3">Areas of agreement</div>
            <div className="flex flex-wrap gap-2">
              {report.consensusAreas.map((area, index) => (
                <span
                  key={index}
                  className="rounded-full bg-agree/14 border border-agree/30 text-agree font-mono text-[10px] uppercase tracking-[0.06em] px-3 py-1"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
