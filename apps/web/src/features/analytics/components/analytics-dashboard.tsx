"use client";

import { useState, useEffect } from "react";
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
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  MessageSquare,
  Zap,
  Terminal,
} from "lucide-react";

interface AnalyticsData {
  totalDebates: number;
  totalCost: number;
  debatesThisMonth: number;
  costThisMonth: number;
  debatesByDay: Array<{ date: string; count: number }>;
  modelUsage: Array<{ model: string; count: number }>;
  debatesBySource?: Array<{ source: string; count: number }>;
  cliDebateCount?: number;
}

function formatSourceLabel(source: string): string {
  const s = source || "unknown";
  if (s === "web") return "Web app";
  if (s === "cli") return "CLI";
  if (s === "mcp") return "MCP";
  if (s === "deliberation") return "Deliberation";
  return s;
}

const CHART_COLORS = [
  "rgb(var(--warm))",
  "rgb(var(--agree))",
  "rgb(var(--warm-bright))",
  "rgb(var(--ink-secondary))",
  "rgb(var(--dissent))",
];

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
          {label}
        </span>
        <Icon className="h-4 w-4 text-ink-muted" />
      </div>
      <div className="font-display text-[32px] tracking-[-0.02em] text-ink-primary font-light">
        {value}
      </div>
      {sublabel && (
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mt-1">
          {sublabel}
        </p>
      )}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const raw = (await response.json()) as AnalyticsData;
        setData({
          debatesBySource: [],
          cliDebateCount: 0,
          ...raw,
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="container mx-auto p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
          Loading analytics…
        </p>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "rgb(var(--bg-1))",
    border: "1px solid rgb(255 255 255 / 0.08)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "rgb(var(--ink-primary))",
  } as const;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="eyebrow mb-2">Telemetry</div>
        <h1 className="font-display text-[40px] tracking-[-0.02em] text-ink-primary font-light">
          Usage <em className="text-warm italic">analytics</em>
        </h1>
        <p className="text-[14px] text-ink-secondary mt-2">
          Track deliberation volume, cost, and model mix across surfaces.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total debates"
          value={data.totalDebates}
          sublabel={`${data.debatesThisMonth} this month`}
          icon={MessageSquare}
        />
        <StatCard
          label="Total cost"
          value={`$${data.totalCost.toFixed(2)}`}
          sublabel={`$${data.costThisMonth.toFixed(2)} this month`}
          icon={DollarSign}
        />
        <StatCard
          label="This month"
          value={data.debatesThisMonth}
          sublabel="Debates completed"
          icon={TrendingUp}
        />
        <StatCard
          label="Avg cost"
          value={`$${
            data.totalDebates > 0
              ? (data.totalCost / data.totalDebates).toFixed(4)
              : "0.0000"
          }`}
          sublabel="Per debate"
          icon={Zap}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4">
            <div className="eyebrow">Activity</div>
            <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
              Debates by day
            </h3>
            <p className="text-[12px] text-ink-tertiary mt-1">Last 7 days</p>
          </div>
          {data.debatesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.debatesByDay.slice(-7)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgb(255 255 255 / 0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
                  stroke="rgb(255 255 255 / 0.08)"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgb(var(--ink-tertiary))" }}
                  stroke="rgb(255 255 255 / 0.08)"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  fill="rgb(var(--warm))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[13px] text-ink-tertiary">
              No data yet. Start a debate to see activity.
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <div className="eyebrow">Mix</div>
            <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
              Model usage
            </h3>
            <p className="text-[12px] text-ink-tertiary mt-1">
              Most used models
            </p>
          </div>
          {data.modelUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.modelUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, percent }) =>
                    `${model} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="count"
                  stroke="rgb(var(--bg-1))"
                >
                  {data.modelUsage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[13px] text-ink-tertiary">
              No data yet. Complete a debate to see model usage.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4">
            <div className="eyebrow">Source</div>
            <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
              Where debates start
            </h3>
            <p className="text-[12px] text-ink-tertiary mt-1">
              Web, CLI, MCP, and deliberation sessions
            </p>
          </div>
          {(data.debatesBySource ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(data.debatesBySource ?? []).map((row) => ({
                    name: formatSourceLabel(row.source),
                    count: row.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  dataKey="count"
                  nameKey="name"
                  stroke="rgb(var(--bg-1))"
                >
                  {(data.debatesBySource ?? []).map((_, index) => (
                    <Cell
                      key={`src-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-[13px] text-ink-tertiary">
              No sessions yet.
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="h-4 w-4 text-warm" />
            <div>
              <div className="eyebrow">Terminal</div>
              <h3 className="font-display text-[20px] tracking-[-0.01em] text-ink-primary mt-1">
                CLI activity
              </h3>
            </div>
          </div>
          <p className="text-[12px] text-ink-tertiary mb-4">
            Classic debates started from the Consilium CLI
          </p>
          <div className="font-display text-[40px] tracking-[-0.02em] text-ink-primary font-light">
            {data.cliDebateCount ?? 0}
          </div>
          <p className="mt-3 text-[13px] text-ink-secondary leading-[1.6]">
            Run{" "}
            <span className="font-mono text-[12px] bg-bg-2 border border-white/[0.08] rounded px-1.5 py-0.5 text-warm">
              consilium login
            </span>{" "}
            then{" "}
            <span className="font-mono text-[12px] bg-bg-2 border border-white/[0.08] rounded px-1.5 py-0.5 text-warm">
              consilium debate
            </span>{" "}
            or{" "}
            <span className="font-mono text-[12px] bg-bg-2 border border-white/[0.08] rounded px-1.5 py-0.5 text-warm">
              consilium chat
            </span>
            . Sessions are tagged automatically so they appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
