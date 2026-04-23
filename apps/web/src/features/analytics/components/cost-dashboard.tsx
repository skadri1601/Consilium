"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ModelCostEntry {
  modelId: string;
  modelName: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface RoundCostEntry {
  round: number;
  totalCost: number;
  models: Record<string, number>;
}

interface CumulativeCostPoint {
  timestamp: string;
  cost: number;
  round: number;
}

interface CostEstimate {
  estimatedTotal: number;
  actualTotal: number;
}

export interface CostDashboardData {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  modelCosts: ModelCostEntry[];
  roundCosts: RoundCostEntry[];
  cumulativeCosts: CumulativeCostPoint[];
  estimate?: CostEstimate;
  isActive: boolean;
}

export interface CostDashboardProps {
  data: CostDashboardData;
  debateId: string;
  streaming?: boolean;
  className?: string;
}

const CHART_COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--warm-bright))",
  "rgb(var(--dissent))",
  "rgb(var(--ink-secondary))",
  "rgb(var(--ink-tertiary))",
];

function formatCurrency(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

function getModelColor(_provider: string, index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-ink-tertiary">
      <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-[13px]">{message}</p>
    </div>
  );
}

type TabKey = "overview" | "rounds" | "models";

export function CostDashboard({
  data,
  streaming = false,
  className,
}: CostDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const prevTotalRef = useRef(data.totalCost);

  useEffect(() => {
    prevTotalRef.current = data.totalCost;
  }, [data.totalCost]);

  const modelColorMap = useMemo(() => {
    const map = new Map<string, string>();
    data.modelCosts.forEach((m, i) => {
      map.set(m.modelId, getModelColor(m.provider, i));
    });
    return map;
  }, [data.modelCosts]);

  const stackedRoundData = useMemo(() => {
    return data.roundCosts.map((r) => ({
      name: `R${r.round}`,
      ...r.models,
      total: r.totalCost,
    }));
  }, [data.roundCosts]);

  const pieData = useMemo(() => {
    return data.modelCosts
      .filter((m) => m.cost > 0)
      .map((m) => ({
        name: m.modelName,
        value: m.cost,
        modelId: m.modelId,
      }));
  }, [data.modelCosts]);

  const mostExpensiveRound = useMemo(() => {
    if (data.roundCosts.length === 0) return null;
    return data.roundCosts.reduce((max, r) =>
      r.totalCost > max.totalCost ? r : max,
    );
  }, [data.roundCosts]);

  const spendProgress = useMemo(() => {
    if (!data.estimate || data.estimate.estimatedTotal <= 0) return null;
    return Math.min((data.totalCost / data.estimate.estimatedTotal) * 100, 100);
  }, [data.totalCost, data.estimate]);

  const tooltipStyle = {
    backgroundColor: "rgb(var(--bg-1))",
    border: "1px solid rgb(255 255 255 / 0.08)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "rgb(var(--ink-primary))",
  } as const;

  const hasData = data.modelCosts.length > 0;
  const hasCosts = data.totalCost > 0;

  if (!hasData) {
    return (
      <div className={cn("surface-card p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-agree" />
          <h2 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary">
            Cost dashboard
          </h2>
        </div>
        <EmptyState message="No cost data available yet. Start a deliberation to track costs." />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-agree" />
            <div>
              <div className="eyebrow">Spend</div>
              <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1 flex items-center gap-2">
                Cost dashboard
                {streaming && data.isActive && (
                  <span className="h-2 w-2 rounded-full bg-warm animate-warm-pulse" />
                )}
              </h3>
              {data.estimate && (
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mt-1">
                  Estimated: {formatCurrency(data.estimate.estimatedTotal)}
                </p>
              )}
            </div>
          </div>
          <motion.span
            key={data.totalCost}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="font-display text-[30px] tracking-[-0.02em] text-ink-primary"
          >
            {formatCurrency(data.totalCost)}
          </motion.span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Tokens in
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-agree" />
              {formatTokenCount(data.totalInputTokens)}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Tokens out
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-warm" />
              {formatTokenCount(data.totalOutputTokens)}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Models
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary">
              {data.modelCosts.length}
            </p>
          </div>
          <div className="rounded-[10px] border border-white/[0.08] bg-bg-1 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-1">
              Rounds
            </p>
            <p className="font-display text-[16px] tracking-[-0.01em] text-ink-primary">
              {data.roundCosts.length}
            </p>
          </div>
        </div>

        {spendProgress !== null && data.estimate && (
          <div className="mb-4">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mb-1.5">
              <span>Spend progress</span>
              <span className="text-ink-secondary">
                {formatCurrency(data.totalCost)} /{" "}
                {formatCurrency(data.estimate.estimatedTotal)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-2 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  spendProgress > 90
                    ? "bg-dissent"
                    : spendProgress > 70
                      ? "bg-warm"
                      : "bg-agree",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${spendProgress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 font-mono text-[10px] uppercase tracking-[0.06em]">
              <span className="text-ink-tertiary">
                {spendProgress.toFixed(1)}% of estimate
              </span>
              {data.estimate.estimatedTotal > data.totalCost && (
                <span className="text-agree">
                  {formatCurrency(
                    data.estimate.estimatedTotal - data.totalCost,
                  )}{" "}
                  remaining
                </span>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {data.estimate &&
            data.estimate.estimatedTotal > 0 &&
            data.totalCost > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "mb-4 rounded-[10px] border p-3",
                  data.totalCost <= data.estimate.estimatedTotal
                    ? "border-agree/30 bg-agree/6"
                    : "border-dissent/30 bg-dissent/6",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Estimated vs actual
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-ink-tertiary">
                      Est: {formatCurrency(data.estimate.estimatedTotal)}
                    </span>
                    <span className="text-ink-primary">
                      Actual: {formatCurrency(data.totalCost)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded border",
                        data.totalCost <= data.estimate.estimatedTotal
                          ? "bg-agree/14 text-agree border-agree/30"
                          : "bg-dissent/14 text-dissent border-dissent/30",
                      )}
                    >
                      {data.totalCost <= data.estimate.estimatedTotal
                        ? `-${formatCurrency(data.estimate.estimatedTotal - data.totalCost)}`
                        : `+${formatCurrency(data.totalCost - data.estimate.estimatedTotal)}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        <div className="flex gap-1 mb-4 border-b border-white/[0.06]">
          {(["overview", "rounds", "models"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "border-warm text-warm"
                  : "border-transparent text-ink-tertiary hover:text-ink-primary",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {hasCosts && pieData.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
                  Cost by model
                </p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={600}
                        stroke="rgb(var(--bg-1))"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.modelId}
                            fill={
                              modelColorMap.get(entry.modelId) ||
                              CHART_COLORS[0]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Cost",
                        ]}
                      />
                      <Legend
                        formatter={(value) => (
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-secondary">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {data.cumulativeCosts.length > 1 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
                  Cumulative cost over time
                </p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.cumulativeCosts}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgb(255 255 255 / 0.06)"
                      />
                      <XAxis
                        dataKey="round"
                        tick={{
                          fontSize: 11,
                          fill: "rgb(var(--ink-tertiary))",
                        }}
                        stroke="rgb(255 255 255 / 0.08)"
                        tickFormatter={(v) => `R${v}`}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "rgb(var(--ink-tertiary))",
                        }}
                        stroke="rgb(255 255 255 / 0.08)"
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Total cost",
                        ]}
                        labelFormatter={(label) => `Round ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="rgb(var(--warm))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "rgb(var(--warm))" }}
                        activeDot={{ r: 5 }}
                        animationDuration={800}
                      />
                      {data.estimate && (
                        <Line
                          type="monotone"
                          dataKey={() => data.estimate!.estimatedTotal}
                          stroke="rgb(var(--ink-tertiary))"
                          strokeWidth={1}
                          strokeDasharray="6 3"
                          dot={false}
                          name="Estimated"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "rounds" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {data.roundCosts.length === 0 ? (
              <EmptyState message="No round data available yet." />
            ) : (
              <>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary mb-2">
                    Cost per round · stacked by model
                  </p>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stackedRoundData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgb(255 255 255 / 0.06)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 11,
                            fill: "rgb(var(--ink-tertiary))",
                          }}
                          stroke="rgb(255 255 255 / 0.08)"
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "rgb(var(--ink-tertiary))",
                          }}
                          stroke="rgb(255 255 255 / 0.08)"
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: number, name: string) => {
                            const model = data.modelCosts.find(
                              (m) => m.modelId === name,
                            );
                            return [
                              formatCurrency(value),
                              model?.modelName || name,
                            ];
                          }}
                        />
                        <Legend
                          formatter={(value) => {
                            const model = data.modelCosts.find(
                              (m) => m.modelId === value,
                            );
                            return (
                              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-secondary">
                                {model?.modelName || value}
                              </span>
                            );
                          }}
                        />
                        {data.modelCosts.map((m) => (
                          <Bar
                            key={m.modelId}
                            dataKey={m.modelId}
                            stackId="cost"
                            fill={
                              modelColorMap.get(m.modelId) || CHART_COLORS[0]
                            }
                            radius={[0, 0, 0, 0]}
                            animationDuration={600}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {mostExpensiveRound && (
                  <div className="rounded-[10px] border border-warm/30 bg-warm/6 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-warm" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-secondary">
                          Most expensive round
                        </span>
                      </div>
                      <div className="font-mono text-[12px]">
                        <span className="text-ink-primary">
                          Round {mostExpensiveRound.round}
                        </span>
                        <span className="text-ink-tertiary ml-2">
                          {formatCurrency(mostExpensiveRound.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                          Round
                        </th>
                        <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                          Cost
                        </th>
                        <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                          % of total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.roundCosts.map((r) => (
                        <tr
                          key={r.round}
                          className={cn(
                            "border-b border-white/[0.04] last:border-0",
                            mostExpensiveRound?.round === r.round &&
                              "bg-warm/6",
                          )}
                        >
                          <td className="py-2 px-3 text-ink-primary">
                            Round {r.round}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-primary">
                            {formatCurrency(r.totalCost)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-tertiary">
                            {data.totalCost > 0
                              ? `${((r.totalCost / data.totalCost) * 100).toFixed(1)}%`
                              : "0%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === "models" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {data.modelCosts.length === 0 ? (
              <EmptyState message="No model data available yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        Model
                      </th>
                      <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        Input
                      </th>
                      <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        Output
                      </th>
                      <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        Cost
                      </th>
                      <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                        % of total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.modelCosts
                      .sort((a, b) => b.cost - a.cost)
                      .map((m) => (
                        <tr
                          key={m.modelId}
                          className="border-b border-white/[0.04] last:border-0"
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    modelColorMap.get(m.modelId) ||
                                    CHART_COLORS[0],
                                }}
                              />
                              <span className="text-ink-primary">
                                {m.modelName}
                              </span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-bg-2 border border-white/[0.08] text-ink-tertiary">
                                {m.provider}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-secondary">
                            {formatTokenCount(m.inputTokens)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-secondary">
                            {formatTokenCount(m.outputTokens)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-primary">
                            {m.cost === 0 ? (
                              <span className="text-agree">Free</span>
                            ) : (
                              formatCurrency(m.cost)
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-ink-tertiary">
                            {data.totalCost > 0
                              ? `${((m.cost / data.totalCost) * 100).toFixed(1)}%`
                              : "0%"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-white/[0.08]">
                      <td className="py-2 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-primary">
                        Total
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-ink-primary">
                        {formatTokenCount(data.totalInputTokens)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-ink-primary">
                        {formatTokenCount(data.totalOutputTokens)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-ink-primary">
                        {formatCurrency(data.totalCost)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-ink-primary">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
