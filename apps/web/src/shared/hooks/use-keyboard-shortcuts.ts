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
        const isCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const isMeta = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const isShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const isAlt = shortcut.altKey ? event.altKey : !event.altKey;
        const isKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Handle Cmd/Ctrl (metaKey on Mac, ctrlKey on Windows/Linux)
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

