"use client";

import { cn } from "@/shared/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "@/components/shared/brand-mark";

interface NavProps {
  items?: {
    title: string;
    href: string;
    disabled?: boolean;
    external?: boolean;
  }[];
}

function SignInActions() {
  return (
    <>
      <Link href="/sign-in" className="btn-consilium btn-consilium-ghost">
        Sign in
      </Link>
      <Link href="/sign-up" className="btn-consilium btn-consilium-primary">
        Try Council
      </Link>
    </>
  );
}

function AuthActionsInner() {
  const { user } = useUser();
  if (user) {
    return (
      <Link href="/council" className="btn-consilium btn-consilium-primary">
        Council ↗
      </Link>
    );
  }
  return <SignInActions />;
}

function AuthActions() {
  return (
    <React.Suspense fallback={<SignInActions />}>
      <AuthActionsInner />
    </React.Suspense>
  );
}

function MobileMenu({
  items,
  onClose,
}: Readonly<NavProps & { onClose: () => void }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="md:hidden border-t border-white/[0.08] bg-bg-0/90 backdrop-blur-xl"
    >
      <nav className="container-narrow flex flex-col gap-1 py-4">
        {items?.map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            onClick={onClose}
            className={cn(
              "px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary transition-colors rounded-md hover:bg-white/[0.04]",
              item.disabled && "cursor-not-allowed opacity-60",
            )}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
          >
            {item.title}
          </Link>
        ))}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
          <AuthActions />
        </div>
      </nav>
    </motion.div>
  );
}

export function MarketingHeader(props: Readonly<NavProps>) {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 bg-bg-0/72 backdrop-blur-xl border-b border-white/[0.08]"
      style={{
        animation: "slideDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      }}
    >
      <div className="container-narrow flex items-center justify-between gap-6 py-[18px]">
        <Link
          href="/"
          className="flex items-center gap-[10px] font-display font-medium text-[18px] tracking-[-0.01em] text-ink-primary"
        >
          <BrandMark />
          Consilium
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {props.items?.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "text-[13px] text-ink-secondary hover:text-ink-primary transition-colors",
                item.disabled && "cursor-not-allowed opacity-60",
              )}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-[10px]">
          <div className="hidden md:flex items-center gap-[10px]">
            <AuthActions />
          </div>

          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/[0.06] transition-colors"
          >
            {showMobileMenu ? (
              <X className="h-4 w-4 text-ink-secondary" />
            ) : (
              <Menu className="h-4 w-4 text-ink-secondary" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMobileMenu && props.items && (
          <MobileMenu
            items={props.items}
            onClose={() => setShowMobileMenu(false)}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
