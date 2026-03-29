"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Keyboard } from "lucide-react";

const shortcuts = [
  {
    mac: ["⌘", "K"],
    windows: ["Ctrl", "K"],
    description: "Focus debate input",
  },
  {
    mac: ["⌘", "Enter"],
    windows: ["Ctrl", "Enter"],
    description: "Submit debate",
  },
  {
    mac: ["⌘", "C"],
    windows: ["Ctrl", "C"],
    description: "Copy Synthesis (when visible)",
  },
  {
    mac: ["Esc"],
    windows: ["Esc"],
    description: "Close modal/dialog",
  },
];

export function KeyboardShortcutsHelp() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => {
            const keys = isMac ? shortcut.mac : shortcut.windows;
            return (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

