import { CouncilChat } from "@/features/council";

export default function CouncilPage() {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Council</h1>
        <p className="text-muted-foreground">
          Get collaborative insights from multiple AI agents
        </p>
      </div>
      <CouncilChat />
    </div>
  );
}
