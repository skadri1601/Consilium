import { AnalyticsDashboard } from "@/features/analytics";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track usage, costs, and performance metrics
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
