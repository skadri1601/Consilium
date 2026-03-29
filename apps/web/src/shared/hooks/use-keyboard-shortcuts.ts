"use client";

import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const isShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const isAlt = shortcut.altKey ? event.altKey : !event.altKey;
        const isKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        const isModifier =
          shortcut.ctrlKey || shortcut.metaKey
            ? event.ctrlKey || event.metaKey
            : !event.ctrlKey && !event.metaKey;

        if (isKey && isModifier && isShift && isAlt) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

