import { cn } from "@/shared/lib/utils";

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={cn("brand-mark", size === "sm" && "sm", className)}
    />
  );
}
