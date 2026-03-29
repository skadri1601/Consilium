"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ReactNode } from "react";

export function TestModeClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/council"
      signUpFallbackRedirectUrl="/council"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "hsl(0 0% 98%)",
          colorText: "hsl(0 0% 98%)",
          colorBackground: "hsl(240 10% 3.9%)",
          colorInputBackground: "hsl(240 3.7% 15.9%)",
          colorInputText: "hsl(0 0% 98%)",
        },
        elements: {
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90 normal-case",
          card: "bg-background",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground normal-case",
          socialButtonsBlockButtonText: "text-foreground font-normal",
          formFieldLabel: "text-foreground",
          formFieldInput:
            "border-input bg-background text-foreground",
          footerActionLink: "text-primary hover:text-primary/90",
          identityPreviewText: "text-foreground",
          identityPreviewEditButton: "text-muted-foreground",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
