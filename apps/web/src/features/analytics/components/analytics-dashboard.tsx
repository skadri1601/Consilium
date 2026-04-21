"use client";

import { useState, useEffect } from "react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Track your debate usage and costs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDebates}</div>
            <p className="text-xs text-muted-foreground">
              {data.debatesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${data.costThisMonth.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.debatesThisMonth}</div>
            <p className="text-xs text-muted-foreground">debates completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {data.totalDebates > 0
                ? (data.totalCost / data.totalDebates).toFixed(4)
                : "0.0000"}
            </div>
            <p className="text-xs text-muted-foreground">per debate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Debates by Day</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.debatesByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.debatesByDay.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No data yet. Start a debate to see activity.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Most used models</CardDescription>
          </CardHeader>
          <CardContent>
            {data.modelUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.modelUsage.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No data yet. Complete a debate to see model usage.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where debates start</CardTitle>
            <CardDescription>
              Web, CLI, MCP, and deliberation sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(data.debatesBySource ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
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
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                  >
                    {(data.debatesBySource ?? []).map((_, index) => (
                      <Cell
                        key={`src-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No sessions yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>CLI</CardTitle>
              <CardDescription>
                Classic debates started from the Consilium CLI
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.cliDebateCount ?? 0}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <span className="font-mono text-xs">consilium login</span>{" "}
              then <span className="font-mono text-xs">consilium debate</span>{" "}
              or <span className="font-mono text-xs">consilium chat</span>.
              Sessions are tagged automatically so they appear here and in the
              chart.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
