"use client";

import { cn } from "@/shared/lib/utils";

interface DiversityScoreProps {
  score: number;
  warning?: boolean;
}

export function DiversityScore({ score, warning }: DiversityScoreProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 50 ? "text-green-400" : pct >= 25 ? "text-yellow-400" : "text-red-400";
  const label =
    pct >= 50 ? "High Diversity" : pct >= 25 ? "Moderate" : "Echo Chamber Risk";
  const circumference = 2 * Math.PI * 15.9;
  const dashArray = `${(pct / 100) * circumference} ${circumference - (pct / 100) * circumference}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <div className="relative h-12 w-12 shrink-0">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-neutral-800"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={dashArray}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-bold",
            color
          )}
        >
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-sm font-medium">Perspective Diversity</p>
        <p className={cn("text-xs", color)}>{label}</p>
        {warning && (
          <p className="text-xs text-red-400 mt-0.5">
            Models may be echoing each other
          </p>
        )}
      </div>
    </div>
  );
}
