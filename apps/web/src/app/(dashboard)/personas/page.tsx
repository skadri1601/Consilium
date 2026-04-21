import { PersonaManager } from "@/features/personas/components/persona-manager";
import { PageHeader } from "@/components/shared/page-header";

export default function PersonasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Personas"
        title={
          <>
            Voices the Council can{" "}
            <em className="not-italic text-warm">summon.</em>
          </>
        }
        description="Custom system prompts that shape how each model approaches the topic. Reuse them across deliberations."
      />
      <div className="px-6 lg:px-8 py-8">
        <PersonaManager />
      </div>
    </>
  );
}
