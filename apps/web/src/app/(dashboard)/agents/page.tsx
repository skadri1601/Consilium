import { AgentList } from "@/features/agents";
import { PageHeader } from "@/components/shared/page-header";

export default function AgentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Agents"
        title={
          <>
            Models on the <em className="not-italic text-warm">bench.</em>
          </>
        }
        description="Available LLM models and their configuration status. Bring your own keys for any provider you want to seat in the Council."
      />
      <div className="px-6 lg:px-8 py-8">
        <AgentList />
      </div>
    </>
  );
}
