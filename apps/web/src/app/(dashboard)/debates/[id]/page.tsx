import { DebateDetail } from "@/features/debates/components/debate-detail";

export default function DebateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <DebateDetail debateId={params.id} />;
}

