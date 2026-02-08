import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/shared/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TestModeClerkProvider } from "@/components/test-mode-clerk-provider";
import { ThemeProvider } from "@/app/provider";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Consilium - Council",
  description:
    "Multi-agent debate platform for better prompts and recommendations",
  keywords: ["consilium", "debate", "prompts", "multi-agent", "synthesis"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TestModeClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${inter.className} antialiased font-normal`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
            <ErrorBoundary>
              <OnboardingProvider>
                {children}
                <Toaster />
              </OnboardingProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </TestModeClerkProvider>
  );
}
