"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
  const Component = mode === "sign-in" ? SignIn : SignUp;

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <Component
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path={mode === "sign-in" ? "/sign-in" : "/sign-up"}
      />
    </div>
  );
}
