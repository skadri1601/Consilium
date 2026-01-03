"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Users, MessageSquare, History, BarChart3, Settings } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const navigation = [
  { name: "Council", href: "/council", icon: Users },
  { name: "Agents", href: "/agents", icon: MessageSquare },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/council" className="text-xl font-bold">
          Consilium
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1">
            <p className="text-sm font-medium">Account</p>
          </div>
          <Link href="/settings" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
