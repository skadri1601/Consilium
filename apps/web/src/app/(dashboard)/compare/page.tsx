import { ComparisonForm } from "@/features/compare/components/comparison-form";
import { ArrowRightLeft } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Compare Two Approaches</h1>
        </div>
        <p className="text-muted-foreground">
          Run a head-to-head debate between two options and get a synthesized verdict.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-dashed border-border p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-md border border-primary/30 bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Option A</p>
            <p className="text-sm font-semibold text-primary">Your first choice</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-bold text-muted-foreground">VS</span>
          </div>
          <div className="flex-1 rounded-md border border-indigo-500/30 bg-indigo-500/5 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Option B</p>
            <p className="text-sm font-semibold text-indigo-400">Your second choice</p>
          </div>
        </div>
      </div>

      <ComparisonForm />
    </div>
  );
}
