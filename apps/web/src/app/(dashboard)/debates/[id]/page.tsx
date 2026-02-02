import { DebateDetail } from "@/features/debates/components/debate-detail";

export default async function DebateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DebateDetail debateId={id} />;
}

