"use client";

import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/shared/logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Logo className="mr-6" link="/" />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
