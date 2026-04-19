"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Bug,
  Layers,
  Code2,
  ListOrdered,
  ShieldAlert,
  TrendingUp,
  FlaskConical,
  Scale,
  LayoutTemplate,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: "engineering" | "product" | "business" | "research" | "ethics";
  icon: string;
  estimatedCostCents: number;
  placeholder: string;
}

const TEMPLATES: Template[] = [
  {
    id: "bug-triage",
    name: "Bug Triage",
    description: "Root cause, severity, and fix approach analysis",
    category: "engineering",
    icon: "bug",
    estimatedCostCents: 8,
    placeholder: "Paste your bug report or stack trace...",
  },
  {
    id: "architecture-decision",
    name: "Architecture ADR",
    description: "Debate competing architectural approaches with trade-offs",
    category: "engineering",
    icon: "layers",
    estimatedCostCents: 25,
    placeholder: "Describe the architectural decision...",
  },
  {
    id: "code-review",
    name: "Code Review Panel",
    description: "Multi-reviewer debate on correctness, performance, security",
    category: "engineering",
    icon: "code-2",
    estimatedCostCents: 12,
    placeholder: "Paste your code...",
  },
  {
    id: "feature-prioritization",
    name: "Feature Prioritization",
    description: "Impact vs effort analysis for competing features",
    category: "product",
    icon: "list-ordered",
    estimatedCostCents: 6,
    placeholder: "List your feature candidates...",
  },
  {
    id: "risk-assessment",
    name: "Risk Assessment",
    description: "Red team analysis: failure modes, attack vectors, edge cases",
    category: "business",
    icon: "shield-alert",
    estimatedCostCents: 30,
    placeholder: "Describe the plan or system to stress-test...",
  },
  {
    id: "market-analysis",
    name: "Market Analysis",
    description: "SWOT, competitive landscape, positioning debate",
    category: "business",
    icon: "trending-up",
    estimatedCostCents: 15,
    placeholder: "Describe your business or market...",
  },
  {
    id: "research-direction",
    name: "Research Direction",
    description: "Novelty, feasibility, and impact debate on research questions",
    category: "research",
    icon: "flask-conical",
    estimatedCostCents: 35,
    placeholder: "Describe your research question...",
  },
  {
    id: "ethical-dilemma",
    name: "Ethical Dilemma",
    description: "Utilitarian, deontological, and virtue ethics perspectives",
    category: "ethics",
    icon: "scale",
    estimatedCostCents: 28,
    placeholder: "Describe the ethical situation...",
  },
];

const CATEGORY_STYLES: Record<Template["category"], { badge: string; card: string }> = {
  engineering: {
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    card: "hover:border-indigo-500/50",
  },
  product: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    card: "hover:border-purple-500/50",
  },
  business: {
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    card: "hover:border-green-500/50",
  },
  research: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    card: "hover:border-orange-500/50",
  },
  ethics: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    card: "hover:border-rose-500/50",
  },
};

function TemplateIcon({ icon, className }: { icon: string; className?: string }) {
  const props = { className: cn("h-5 w-5", className) };
  switch (icon) {
    case "bug":
      return <Bug {...props} />;
    case "layers":
      return <Layers {...props} />;
    case "code-2":
      return <Code2 {...props} />;
    case "list-ordered":
      return <ListOrdered {...props} />;
    case "shield-alert":
      return <ShieldAlert {...props} />;
    case "trending-up":
      return <TrendingUp {...props} />;
    case "flask-conical":
      return <FlaskConical {...props} />;
    case "scale":
      return <Scale {...props} />;
    default:
      return <LayoutTemplate {...props} />;
  }
}

interface TemplatePickerProps {
  onSelect: (template: Template) => void;
  disabled?: boolean;
}

export function TemplatePicker({ onSelect, disabled }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(template: Template) {
    onSelect(template);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {TEMPLATES.map((template) => {
            const styles = CATEGORY_STYLES[template.category];
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={cn(
                  "text-left rounded-lg border border-border bg-card p-4 transition-all duration-200",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
                  styles.card
                )}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-md bg-muted p-1.5 shrink-0">
                    <TemplateIcon icon={template.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{template.name}</p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize mt-0.5",
                        styles.badge
                      )}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {template.description}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Est. ~${(template.estimatedCostCents / 100).toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Template };
