"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        const modifierMatches =
          shortcut.ctrlKey || shortcut.metaKey
            ? event.ctrlKey || event.metaKey
            : !event.ctrlKey && !event.metaKey;

        if (
          keyMatches &&
          modifierMatches &&
          shiftMatches &&
          altMatches &&
          !event.defaultPrevented
        ) {
          const target = event.target as HTMLElement;
          const isInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable;

          if (isInput && shortcut.key.toLowerCase() !== "k") {
            continue;
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common keyboard shortcuts for the app
export const COMMON_SHORTCUTS = {
  FOCUS_DEBATE_INPUT: {
    key: "k",
    ctrlKey: true,
    metaKey: true,
    description: "Focus debate input",
  },
  COPY_GOLDEN_PROMPT: {
    key: "c",
    ctrlKey: true,
    metaKey: true,
    description: "Copy Synthesis",
  },
  CLOSE_MODAL: {
    key: "Escape",
    description: "Close modal/dialog",
  },
  SUBMIT_DEBATE: {
    key: "Enter",
    ctrlKey: true,
    metaKey: true,
    description: "Submit debate",
  },
} as const;

