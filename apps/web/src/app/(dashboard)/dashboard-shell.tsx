"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { BrandMark } from "@/components/shared/brand-mark";
import { GrainOverlay } from "@/components/shared/grain-overlay";
import { UserButton, useUser } from "@clerk/nextjs";

type NavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/council", label: "Council" },
      { href: "/history", label: "History" },
      { href: "/analytics", label: "Analytics" },
      { href: "/personas", label: "Personas" },
      { href: "/agents", label: "Agents" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/docs", label: "Docs" },
    ],
  },
];

function NavItem({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-2.5 py-2 rounded-md text-[13px] flex items-center gap-2.5 transition-all duration-200",
        isActive
          ? "bg-warm/12 text-warm"
          : "text-ink-secondary hover:bg-bg-2 hover:text-ink-primary"
      )}
    >
      {label}
    </Link>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const initial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "C";

  const isActive = (href: string) => {
    if (href === "/council") return pathname === "/council";
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-bg-0 text-ink-primary relative flex flex-col">
      <GrainOverlay />

      {/* Mobile top bar */}
      <nav className="lg:hidden border-b border-white/[0.08] bg-bg-0/80 backdrop-blur-xl sticky top-0 z-50 relative z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="font-display text-[16px] tracking-[-0.01em] text-ink-primary">
              Consilium
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <UserButton />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-bg-2 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-ink-secondary" />
              ) : (
                <Menu className="h-5 w-5 text-ink-secondary" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-bg-1 px-4 py-3 flex flex-col gap-3">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary px-2.5 py-1">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={isActive(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="flex flex-1 min-h-0 relative z-10">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-bg-1 border-r border-white/[0.08] px-5 py-6 gap-7 sticky top-0 h-screen">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="font-display text-[17px] font-medium tracking-[-0.01em] text-ink-primary">
              Consilium
            </span>
          </Link>

          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary px-2.5 mb-2">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          ))}

          <div className="mt-auto p-2.5 border border-white/[0.08] rounded-lg flex items-center gap-2.5">
            <UserButton />
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate">
                {user?.firstName || user?.username || "Member"}
              </div>
              <div className="text-[10px] text-ink-tertiary truncate">
                {user?.primaryEmailAddress?.emailAddress || "owl@consilium.xyz"}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
