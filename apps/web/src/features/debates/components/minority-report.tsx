"use client";

import { cn } from "@/shared/lib/utils";
import { Scale } from "lucide-react";

interface MinorityReportData {
  sourceModel: string;
  coreClaim: string;
  bestEvidence: string;
  whyOverruled: string;
  dissentStrength: number;
}

interface MinorityReportProps {
  report: MinorityReportData;
  className?: string;
}

function StrengthDots({ value }: { value: number }) {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            i < clamped
              ? "bg-amber-400"
              : "bg-neutral-700"
          )}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{clamped}/5</span>
    </div>
  );
}

export function MinorityReport({ report, className }: MinorityReportProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-500/40 bg-amber-950/10 p-4 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-sm font-semibold text-amber-300">Minority Report</p>
        <span className="ml-auto text-xs text-muted-foreground">{report.sourceModel}</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70 mb-1">
            Core Claim
          </p>
          <p className="text-sm leading-relaxed">{report.coreClaim}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70 mb-1">
            Best Evidence
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{report.bestEvidence}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70 mb-1">
            Why Overruled
          </p>
          <p className="text-sm leading-relaxed text-foreground/70 italic">{report.whyOverruled}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70 mb-1.5">
            Dissent Strength
          </p>
          <StrengthDots value={report.dissentStrength} />
        </div>
      </div>
    </div>
  );
}
