import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = "default",
  showText = true,
  className,
  href
}: LogoProps) {
  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Geometric mark - interlocking circles representing collaboration */}
      <div className={cn("relative flex items-center justify-center",
        size === "sm" && "h-6 w-6",
        size === "default" && "h-8 w-8",
        size === "lg" && "h-12 w-12"
      )}>
        {/* Outer gradient circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/80 to-primary" />
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-background" />
        {/* Center letter */}
        <span className={cn(
          "relative z-10 font-bold text-primary",
          size === "sm" && "text-[10px]",
          size === "default" && "text-xs",
          size === "lg" && "text-base"
        )}>
          C
        </span>
      </div>
      {showText && (
        <span className={cn("font-semibold",
          size === "sm" && "text-base",
          size === "default" && "text-lg",
          size === "lg" && "text-2xl"
        )}>
          Consilium
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

// Keep ConsiliumLogo as alias for backwards compatibility
export function ConsiliumLogo({
  size = "default",
  showText = true,
  className
}: Omit<LogoProps, "href">) {
  return <Logo size={size} showText={showText} className={className} />;
}
