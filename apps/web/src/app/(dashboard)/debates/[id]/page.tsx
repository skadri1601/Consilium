import { DebateDetail } from "@/features/debates/components/debate-detail";

export default async function DebateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="px-6 lg:px-8 py-4 border-b border-white/[0.08] flex items-center gap-4 bg-bg-0">
        <div className="font-mono text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
          Council / History / <span className="text-warm">Session #{id.slice(0, 8)}</span>
        </div>
      </div>
      <div className="px-6 lg:px-8 py-8">
        <DebateDetail debateId={id} />
      </div>
    </>
  );
}
