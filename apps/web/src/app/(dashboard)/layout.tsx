import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardShell from "./dashboard-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
