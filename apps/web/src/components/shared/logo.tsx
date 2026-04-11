import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Logo(props: { className?: string; link?: string; iconOnly?: boolean }) {
  return (
    <Link
      href={props.link ?? "/"}
      className={cn("flex items-center gap-2", props.className)}
    >
      <Image
        src="/brand/consilium-icon.svg"
        alt="Consilium"
        width={24}
        height={24}
        className="h-6 w-6"
      />
      {!props.iconOnly && (
        <span className="font-semibold tracking-wide sm:inline-block">Consilium</span>
      )}
    </Link>
  );
}
