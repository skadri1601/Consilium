"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { BrandMark } from "@/components/shared/brand-mark";
import { GrainOverlay } from "@/components/shared/grain-overlay";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
  const Component = mode === "sign-in" ? SignIn : SignUp;
  const isSignIn = mode === "sign-in";

  return (
    <div className="relative min-h-screen bg-bg-0 text-ink-primary flex flex-col">
      <GrainOverlay />
      <header className="relative z-10 px-6 lg:px-8 py-5 flex items-center justify-between border-b border-white/[0.08]">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display font-medium text-[18px] tracking-[-0.01em] text-ink-primary"
        >
          <BrandMark />
          Consilium
        </Link>
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
        >
          {isSignIn ? "Need an account? Sign up" : "Have an account? Sign in "}
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-9">
            <div className="eyebrow justify-center mb-4 inline-flex">
              {isSignIn ? "Welcome back" : "Create account"}
            </div>
            <h1 className="font-display font-light text-[clamp(28px,4vw,40px)] tracking-[-0.025em] leading-[1.1] text-ink-primary">
              {isSignIn ? (
                <>
                  Re-enter <em className="not-italic text-warm">the council.</em>
                </>
              ) : (
                <>
                  Convene your <em className="not-italic text-warm">first council.</em>
                </>
              )}
            </h1>
            <p className="text-[14px] text-ink-secondary mt-3">
              {isSignIn
                ? "Pick up where you left off."
                : "Bring your own keys. Open source under MIT."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-bg-1 p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
            <Component
              appearance={{
                variables: {
                  colorPrimary: "#d4a574",
                  colorBackground: "#141310",
                  colorText: "#f5efe5",
                  colorTextSecondary: "#a9a29a",
                  colorInputBackground: "#1c1a17",
                  colorInputText: "#f5efe5",
                  borderRadius: "8px",
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0 border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border border-white/[0.18] hover:bg-white/[0.04] text-ink-primary",
                  formButtonPrimary:
                    "bg-warm hover:bg-warm-bright text-bg-0 font-medium",
                  footer: "hidden",
                },
              }}
              routing="path"
              path={isSignIn ? "/sign-in" : "/sign-up"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
