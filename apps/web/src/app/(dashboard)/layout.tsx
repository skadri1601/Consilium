"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Menu, X, Settings, History, BarChart3, Users, Bot } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { KeyboardShortcutsHelp } from "@/components/shared/keyboard-shortcuts-help";
import { Logo } from "@/components/shared/logo";
import { UserButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/council", label: "Council" },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/personas", label: "Personas", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="min-h-screen lg:flex">
      <nav className="lg:hidden border-b bg-background sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Logo link="/" className="shrink-0" />
          <div className="flex items-center gap-2">
            <UserButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t bg-background">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b last:border-b-0",
                    pathname === item.href && "bg-muted font-semibold"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <nav className="hidden lg:flex border-r bg-background w-64 h-screen sticky top-0 shrink-0 overflow-y-auto">
        <div className="flex flex-col w-full p-4">
          <Logo link="/" className="mb-6 shrink-0" />
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  {Icon && <Icon className={cn("h-4 w-4 shrink-0", isActive && "opacity-90")} />}
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          <div className="mt-auto pt-4 border-t space-y-4">
             <div className="flex items-center gap-3 px-2">
                <UserButton
                  userProfileMode="navigation"
                  userProfileUrl="/settings"
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">
                    {user?.fullName || user?.username || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
             </div>
            <KeyboardShortcutsHelp />
          </div>
        </div>
      </nav>

      <div className="flex-1 min-w-0">
        <main>{children}</main>
      </div>
    </div>
  );
}
