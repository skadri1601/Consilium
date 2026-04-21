import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function MarketingHero({
  eyebrow,
  title,
  description,
  actions,
  className,
  size = "md",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const titleSize =
    size === "lg"
      ? "text-[clamp(44px,7vw,88px)]"
      : size === "sm"
        ? "text-[clamp(32px,4.5vw,52px)]"
        : "text-[clamp(40px,6vw,72px)]";

  return (
    <section
      className={cn(
        "relative pt-28 pb-20 border-b border-white/[0.08]",
        className
      )}
    >
      <div className="container-narrow">
        {eyebrow && <div className="eyebrow mb-5">{eyebrow}</div>}
        <h1
          className={cn(
            "display",
            titleSize,
            "max-w-[900px] leading-[1.02]"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            {description}
          </p>
        )}
        {actions && (
          <div className="mt-9 flex flex-wrap gap-3">{actions}</div>
        )}
      </div>
    </section>
  );
}
