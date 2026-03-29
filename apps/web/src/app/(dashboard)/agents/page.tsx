import { AgentList } from "@/features/agents";

export default function AgentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground">
          Available LLM models and their configuration status
        </p>
      </div>
      <AgentList />
    </div>
  );
}
