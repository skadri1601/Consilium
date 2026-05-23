"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "hsl(38, 92%, 50%)",
  openai: "hsl(142, 71%, 45%)",
  google: "hsl(217, 91%, 60%)",
  groq: "hsl(270, 70%, 55%)",
  xai: "hsl(350, 80%, 55%)",
  default: "hsl(210, 40%, 55%)",
};

const CHART_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(270, 70%, 55%)",
  "hsl(350, 80%, 55%)",
  "hsl(180, 60%, 45%)",
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

function getModelColor(provider: string, index: number): string {
  return PROVIDER_COLORS[provider] || CHART_COLORS[index % CHART_COLORS.length];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
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
    // Pass the first element as the explicit seed so .reduce() never
    // throws on an empty array (typescript:S4326 / reduce-no-initial).
    const [first, ...rest] = data.roundCosts;
    return rest.reduce(
      (max, r) => (r.totalCost > max.totalCost ? r : max),
      first,
    );
  }, [data.roundCosts]);

  const spendProgress = useMemo(() => {
    if (!data.estimate || data.estimate.estimatedTotal <= 0) return null;
    return Math.min((data.totalCost / data.estimate.estimatedTotal) * 100, 100);
  }, [data.totalCost, data.estimate]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  const hasData = data.modelCosts.length > 0;
  const hasCosts = data.totalCost > 0;

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Cost Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="No cost data available yet. Start a deliberation to track costs." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card variant={streaming ? "elevated" : "default"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Cost Dashboard
              {streaming && data.isActive && (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </CardTitle>
            <motion.span
              key={data.totalCost}
              initial={{ scale: 1.15, color: "hsl(142, 71%, 45%)" }}
              animate={{ scale: 1, color: "hsl(var(--foreground))" }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold"
            >
              {formatCurrency(data.totalCost)}
            </motion.span>
          </div>
          {data.estimate && (
            <CardDescription>
              Estimated: {formatCurrency(data.estimate.estimatedTotal)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens In</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-blue-500" />
                {formatTokenCount(data.totalInputTokens)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens Out</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-purple-500" />
                {formatTokenCount(data.totalOutputTokens)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Models</p>
              <p className="text-sm font-semibold">{data.modelCosts.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Rounds</p>
              <p className="text-sm font-semibold">{data.roundCosts.length}</p>
            </div>
          </div>

          {spendProgress !== null && data.estimate && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Spend Progress</span>
                <span>
                  {formatCurrency(data.totalCost)} /{" "}
                  {formatCurrency(data.estimate.estimatedTotal)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    spendProgress > 90
                      ? "bg-red-500"
                      : spendProgress > 70
                        ? "bg-yellow-500"
                        : "bg-green-500",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${spendProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {spendProgress.toFixed(1)}% of estimate
                </span>
                {data.estimate.estimatedTotal > data.totalCost && (
                  <span className="text-[10px] text-green-600 dark:text-green-400">
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
                    "mb-4 rounded-lg border p-3",
                    data.totalCost <= data.estimate.estimatedTotal
                      ? "border-green-400/30 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent"
                      : "border-red-400/30 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent",
                  )}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Estimated vs Actual
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        Est: {formatCurrency(data.estimate.estimatedTotal)}
                      </span>
                      <span className="font-semibold">
                        Actual: {formatCurrency(data.totalCost)}
                      </span>
                      <span
                        className={cn(
                          "font-bold text-xs px-1.5 py-0.5 rounded",
                          data.totalCost <= data.estimate.estimatedTotal
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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

          <div className="flex gap-1 mb-4 border-b">
            {(["overview", "rounds", "models"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
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
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Cost by Model
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
                          formatter={(value) => {
                            const numeric =
                              typeof value === "number"
                                ? value
                                : Number(value ?? 0);
                            return [formatCurrency(numeric), "Cost"];
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span className="text-xs">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {data.cumulativeCosts.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Cumulative Cost Over Time
                  </p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.cumulativeCosts}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="round"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `R${v}`}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => {
                            const numeric =
                              typeof value === "number"
                                ? value
                                : Number(value ?? 0);
                            return [formatCurrency(numeric), "Total Cost"];
                          }}
                          labelFormatter={(label) => `Round ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="cost"
                          stroke="hsl(142, 71%, 45%)"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "hsl(142, 71%, 45%)" }}
                          activeDot={{ r: 6 }}
                          animationDuration={800}
                        />
                        {data.estimate && (
                          <Line
                            type="monotone"
                            dataKey={() => data.estimate!.estimatedTotal}
                            stroke="hsl(var(--muted-foreground))"
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
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Cost per Round (Stacked by Model)
                    </p>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stackedRoundData}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => formatCurrency(v)}
                          />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(value, name) => {
                              const numeric =
                                typeof value === "number"
                                  ? value
                                  : Number(value ?? 0);
                              const key = String(name ?? "");
                              const model = data.modelCosts.find(
                                (m) => m.modelId === key,
                              );
                              return [
                                formatCurrency(numeric),
                                model?.modelName || key,
                              ];
                            }}
                          />
                          <Legend
                            formatter={(value) => {
                              const model = data.modelCosts.find(
                                (m) => m.modelId === value,
                              );
                              return (
                                <span className="text-xs">
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
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-muted-foreground">
                            Most Expensive Round
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">
                            Round {mostExpensiveRound.round}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {formatCurrency(mostExpensiveRound.totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                            Round
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                            Cost
                          </th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                            % of Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.roundCosts.map((r) => (
                          <tr
                            key={r.round}
                            className={cn(
                              "border-b last:border-0",
                              mostExpensiveRound?.round === r.round &&
                                "bg-orange-50/50 dark:bg-orange-950/10",
                            )}
                          >
                            <td className="py-2 px-3 font-medium">
                              Round {r.round}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatCurrency(r.totalCost)}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                          Model
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                          Input Tokens
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                          Output Tokens
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                          Cost
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.modelCosts
                        .sort((a, b) => b.cost - a.cost)
                        .map((m) => (
                          <tr
                            key={m.modelId}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      modelColorMap.get(m.modelId) ||
                                      CHART_COLORS[0],
                                  }}
                                />
                                <span className="font-medium">
                                  {m.modelName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                                  {m.provider}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatTokenCount(m.inputTokens)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatTokenCount(m.outputTokens)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              {m.cost === 0 ? (
                                <span className="text-green-600 dark:text-green-400">
                                  Free
                                </span>
                              ) : (
                                formatCurrency(m.cost)
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              {data.totalCost > 0
                                ? `${((m.cost / data.totalCost) * 100).toFixed(1)}%`
                                : "0%"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatTokenCount(data.totalInputTokens)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatTokenCount(data.totalOutputTokens)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatCurrency(data.totalCost)}
                        </td>
                        <td className="py-2 px-3 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
