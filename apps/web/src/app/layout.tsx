import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/shared/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TestModeClerkProvider } from "@/components/test-mode-clerk-provider";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Consilium - AI Council Platform",
  description:
    "Multi-AI agent orchestration system for collaborative problem-solving",
  keywords: ["AI", "LLM", "GPT-4", "Claude", "Gemini", "multi-agent"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TestModeClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ErrorBoundary>
            <OnboardingProvider>
              {children}
              <Toaster />
            </OnboardingProvider>
          </ErrorBoundary>
        </body>
      </html>
    </TestModeClerkProvider>
  );
}
