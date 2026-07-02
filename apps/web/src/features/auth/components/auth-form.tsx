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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
