"use client";

import { cn } from "@/shared/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { buttonVariants } from "@/shared/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

interface NavProps {
  items?: {
    title: string;
    href: string;
    disabled?: boolean;
    external?: boolean;
  }[];
}

function SignInSignUpButtons() {
  return (
    <React.Fragment>
      <Link
        href="/sign-in"
        className="text-sm text-white/60 hover:text-white transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Get Started
      </Link>
    </React.Fragment>
  );
}

function AuthButtonsInner() {
  const { user } = useUser();

  if (user) {
    return (
      <Link
        href="/council"
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Dashboard
      </Link>
    );
  }

  return <SignInSignUpButtons />;
}

function AuthButtons() {
  return (
    <React.Suspense fallback={<SignInSignUpButtons />}>
      <AuthButtonsInner />
    </React.Suspense>
  );
}

function MobileMenu({ items, onClose }: NavProps & { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.08] p-4 md:hidden"
    >
      <nav className="flex flex-col gap-1">
        {items?.map((item, index) => (
          <Link
            key={index}
            href={item.disabled ? "#" : item.href}
            onClick={onClose}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors",
              item.disabled && "cursor-not-allowed opacity-60"
            )}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
          >
            {item.title}
          </Link>
        ))}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
          <AuthButtons />
        </div>
      </nav>
    </motion.div>
  );
}

export function MarketingHeader(props: NavProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest < 50) {
      setVisible(true);
    } else if (latest > previous) {
      setVisible(false);
      setShowMobileMenu(false);
    } else {
      setVisible(true);
    }
  });

  return (
    <>
      <div className="fixed top-4 inset-x-0 mx-auto z-40 pointer-events-none w-fit">
        <div className="h-16 w-[700px] max-w-[calc(100vw-2rem)] bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-indigo-500/10 blur-2xl rounded-full" />
      </div>

      <motion.header
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-4 inset-x-0 mx-auto z-50 w-fit max-w-[calc(100vw-2rem)]"
      >
        <div className="flex h-14 items-center gap-6 rounded-full bg-black/40 backdrop-blur-xl border border-white/[0.08] px-5 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/brand/consilium-icon.svg"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-bold text-white text-sm">Consilium</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {props.items?.map((item, index) => (
              <Link
                key={index}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "relative px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]",
                  item.disabled && "cursor-not-allowed opacity-60"
                )}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <AuthButtons />
            </div>

            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/[0.06] transition-colors"
            >
              {showMobileMenu ? (
                <X className="h-4 w-4 text-white/60" />
              ) : (
                <Menu className="h-4 w-4 text-white/60" />
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
      </motion.header>
    </>
  );
}
