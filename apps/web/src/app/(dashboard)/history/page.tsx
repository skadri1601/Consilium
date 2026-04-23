import { DebateHistory } from "@/features/history/components/debate-history";
import { PageHeader } from "@/components/shared/page-header";

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="History"
        title={
          <>
            Every verdict, with its{" "}
            <em className="not-italic text-warm">audit trail.</em>
          </>
        }
        description="Past Council sessions are preserved verbatim — proposals, challenges, rebuttals, and the reasoning behind each verdict."
      />
      <div className="px-6 lg:px-8 py-8">
        <DebateHistory />
      </div>
    </>
  );
}
