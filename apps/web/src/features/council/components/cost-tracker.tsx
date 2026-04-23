"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import {
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getAgentDisplayName } from "../utils/council-helpers";

interface ModelCost {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface RoundCost {
  round: number;
  cost: number;
}

interface CostData {
  totalCost: number;
  modelCosts: ModelCost[];
  roundCosts: RoundCost[];
  singleModelEstimate?: number;
}

interface CostTrackerProps {
  debateId: string;
  initialCost?: CostData;
  streaming?: boolean;
}

const MODEL_COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--dissent))",
  "rgb(var(--warm-bright))",
  "rgb(var(--ink-secondary))",
  "rgb(var(--ink-tertiary))",
];

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export function CostTracker({
  debateId,
  initialCost,
  streaming = false,
}: CostTrackerProps) {
  const [costData, setCostData] = useState<CostData>(
    initialCost ?? { totalCost: 0, modelCosts: [], roundCosts: [] },
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!streaming || !debateId) return;

    const eventSource = new EventSource(`/api/debates/${debateId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventName = (data.event || "").replace(/_/g, ":");

        if (eventName === "cost:update") {
          setCostData((prev) => ({
            totalCost: data.totalCost ?? data.total_cost ?? prev.totalCost,
            modelCosts: data.modelCosts ?? data.model_costs ?? prev.modelCosts,
            roundCosts: data.roundCosts ?? data.round_costs ?? prev.roundCosts,
            singleModelEstimate:
              data.singleModelEstimate ??
              data.single_model_estimate ??
              prev.singleModelEstimate,
          }));
        }
      } catch {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [debateId, streaming]);

  const totalTokensIn = useMemo(
    () => costData.modelCosts.reduce((sum, m) => sum + m.inputTokens, 0),
    [costData.modelCosts],
  );

  const totalTokensOut = useMemo(
    () => costData.modelCosts.reduce((sum, m) => sum + m.outputTokens, 0),
    [costData.modelCosts],
  );

  const savings = useMemo(() => {
    if (!costData.singleModelEstimate || costData.singleModelEstimate <= 0)
      return null;
    const ratio =
      costData.singleModelEstimate / Math.max(costData.totalCost, 0.0001);
    return { ratio, saved: costData.singleModelEstimate - costData.totalCost };
  }, [costData.totalCost, costData.singleModelEstimate]);

  const modelChartData = useMemo(
    () =>
      costData.modelCosts.map((m) => ({
        name: getAgentDisplayName(m.modelId),
        cost: m.cost,
        modelId: m.modelId,
      })),
    [costData.modelCosts],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-agree" />
            <div>
              <div className="eyebrow">Spend</div>
              <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1 flex items-center gap-2">
                Cost tracker
                {streaming && (
                  <span className="h-2 w-2 rounded-full bg-warm animate-warm-pulse" />
                )}
              </h3>
            </div>
          </div>
          <motion.span
            key={costData.totalCost}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-display text-[28px] tracking-[-0.02em] text-ink-primary"
          >
            {formatCost(costData.totalCost)}
          </motion.span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Tokens in
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-agree" />
              {formatTokens(totalTokensIn)}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Tokens out
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-warm" />
              {formatTokens(totalTokensOut)}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Models
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary">
              {costData.modelCosts.length}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Rounds
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary">
              {costData.roundCosts.length}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {savings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-[10px] border border-agree/30 bg-agree/8 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-agree" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-secondary">
                    vs single-model: {formatCost(costData.singleModelEstimate!)}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-display text-[14px] tracking-[-0.01em]",
                    savings.saved > 0 ? "text-agree" : "text-dissent",
                  )}
                >
                  {savings.saved > 0 ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      {savings.ratio.toFixed(1)}x savings
                    </span>
                  ) : (
                    `+${formatCost(Math.abs(savings.saved))}`
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {modelChartData.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
              Per-model cost
            </p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modelChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "rgb(var(--ink-tertiary))" }}
                    stroke="rgb(255 255 255 / 0.08)"
                    tickFormatter={(v) => formatCost(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
                    stroke="rgb(255 255 255 / 0.08)"
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--bg-1))",
                      border: "1px solid rgb(255 255 255 / 0.08)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "rgb(var(--ink-primary))",
                    }}
                    formatter={(value: number) => [formatCost(value), "Cost"]}
                  />
                  <Bar
                    dataKey="cost"
                    radius={[0, 4, 4, 0]}
                    animationDuration={600}
                  >
                    {modelChartData.map((_entry, index) => (
                      <Cell
                        key={index}
                        fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {costData.roundCosts.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
              Per-round cost
            </p>
            <div className="flex gap-2">
              {costData.roundCosts.map((round, index) => {
                const maxRoundCost = Math.max(
                  ...costData.roundCosts.map((r) => r.cost),
                  0.001,
                );
                const height = Math.max((round.cost / maxRoundCost) * 40, 4);

                return (
                  <motion.div
                    key={round.round}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center gap-1 flex-1"
                    style={{ originY: 1 }}
                  >
                    <div
                      className="w-full rounded-t bg-warm/60"
                      style={{ height: `${height}px` }}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-tertiary">
                      R{round.round}
                    </span>
                    <span className="font-mono text-[10px] text-ink-primary">
                      {formatCost(round.cost)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
