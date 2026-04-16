"use client";

import { cn } from "@/shared/lib/utils";
import { AGENTS } from "@/shared/lib/constants";

const DIMENSIONS = [
  "relevance",
  "sufficiency",
  "acceptability",
  "cogency",
  "rebuttal_quality",
] as const;

type Dimension = (typeof DIMENSIONS)[number];

interface AgentQualityScore {
  agent: string;
  scores: Record<string, number>;
}

interface QualityHeatmapProps {
  qualityScores: AgentQualityScore[];
}

const AGENT_NAME_MAP = new Map<string, string>(AGENTS.map((a) => [a.id, a.name]));

function getAgentName(agentId: string): string {
  return AGENT_NAME_MAP.get(agentId) ?? agentId;
}

function getCellStyle(value: number | undefined): string {
  if (value === undefined) return "bg-neutral-900 text-neutral-600";
  if (value >= 4.5) return "bg-green-500/30 text-green-300";
  if (value >= 3.5) return "bg-green-500/15 text-green-400";
  if (value >= 2.5) return "bg-yellow-500/20 text-yellow-300";
  if (value >= 1.5) return "bg-red-500/15 text-red-400";
  return "bg-red-500/30 text-red-300";
}

function getTotal(scores: Record<string, number>): number {
  return DIMENSIONS.reduce((sum, dim) => sum + (scores[dim] ?? 0), 0);
}

function formatDimension(dim: string): string {
  return dim.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function QualityHeatmap({ qualityScores }: QualityHeatmapProps) {
  if (!qualityScores || qualityScores.length === 0) return null;

  const maxTotal = DIMENSIONS.length * 5;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <p className="text-sm font-medium">Argument Quality</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          1 = poor · 3 = adequate · 5 = excellent
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-36">
                Model
              </th>
              {DIMENSIONS.map((dim) => (
                <th
                  key={dim}
                  className="px-3 py-2 font-medium text-muted-foreground text-center whitespace-nowrap"
                >
                  {formatDimension(dim)}
                </th>
              ))}
              <th className="px-4 py-2 font-medium text-muted-foreground text-center w-28">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {qualityScores.map((row) => {
              const total = getTotal(row.scores);
              const pct = Math.round((total / maxTotal) * 100);
              return (
                <tr key={row.agent} className="border-b border-neutral-800/60 last:border-0">
                  <td className="px-4 py-2 font-medium truncate max-w-[9rem]">
                    {getAgentName(row.agent)}
                  </td>
                  {DIMENSIONS.map((dim) => {
                    const val = row.scores[dim];
                    return (
                      <td
                        key={dim}
                        className={cn(
                          "px-3 py-2 text-center font-semibold tabular-nums",
                          getCellStyle(val)
                        )}
                      >
                        {val !== undefined ? val.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="tabular-nums font-semibold text-foreground w-8 text-right">
                        {total.toFixed(0)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
