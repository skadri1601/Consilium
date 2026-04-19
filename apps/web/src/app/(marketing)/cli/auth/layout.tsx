import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CLI sign-in",
  description: "Authenticate the Consilium CLI.",
  robots: { index: false, follow: false, nocache: true },
};

export default function CliAuthLayout({ children }: { children: ReactNode }) {
  return children;
}
