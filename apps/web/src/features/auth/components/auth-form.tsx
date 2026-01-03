"use client";

import { SignIn, SignUp } from "@clerk/nextjs";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
  const Component = mode === "sign-in" ? SignIn : SignUp;

  return (
    <div className="flex min-h-screen items-center justify-center">
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
