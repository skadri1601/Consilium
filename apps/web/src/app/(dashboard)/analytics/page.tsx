import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title={
          <>
            How the Council <em className="not-italic text-warm">decides.</em>
          </>
        }
        description="Vote distribution, dissent rate, and confidence calibration across your past deliberations."
      />
      <div className="px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </>
  );
}
