"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";
import { useUserPreferences } from "@/shared/hooks/use-user-preferences";
import { AGENTS, MIN_AGENTS_PER_DEBATE, MAX_AGENTS_PER_DEBATE } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";

export function PreferencesSettings() {
  const { preferences, updatePreferences, isLoaded } = useUserPreferences();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<"blind" | "visible">(
    "visible"
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();

  // Sync local state when Clerk data loads
  useEffect(() => {
    if (isLoaded) {
      setSelectedAgents(preferences.defaultAgents);
      setSelectedMode(preferences.defaultMode);
    }
  }, [isLoaded, preferences.defaultAgents, preferences.defaultMode]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      const isSelected = prev.includes(agentId);
      if (!isSelected && prev.length >= MAX_AGENTS_PER_DEBATE) {
        return prev;
      }
      const next = isSelected
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId];
      setDirty(true);
      return next;
    });
  };

  const handleModeChange = (mode: "blind" | "visible") => {
    setSelectedMode(mode);
    setDirty(true);
  };

  const handleSave = async () => {
    if (selectedAgents.length < MIN_AGENTS_PER_DEBATE) {
      toast({
        title: "Error",
        description: `Please select at least ${MIN_AGENTS_PER_DEBATE} default agents`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updatePreferences({
        defaultAgents: selectedAgents,
        defaultMode: selectedMode,
      });
      setDirty(false);
      toast({
        title: "Saved",
        description:
          "Your preferences have been saved and will sync across devices.",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Set your default council configuration. These preferences sync across
          all your devices.
        </p>
      </div>

      {/* Default Agents */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default Agents</CardTitle>
          <CardDescription>
            Choose which agents are pre-selected when you start a new council
            debate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENTS.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              const atLimit = selectedAgents.length >= MAX_AGENTS_PER_DEBATE;
              const isDisabled = !isSelected && atLimit;

              let borderStyle = "border-border hover:bg-accent";
              if (isSelected) borderStyle = "border-primary bg-primary/10";
              else if (isDisabled) borderStyle = "opacity-50 cursor-not-allowed border-border";

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    borderStyle
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.provider}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedAgents.length < MIN_AGENTS_PER_DEBATE && (
            <p className="text-sm text-destructive mt-3">
              Select at least {MIN_AGENTS_PER_DEBATE} default agents.
            </p>
          )}
          {selectedAgents.length >= MAX_AGENTS_PER_DEBATE && (
            <p className="text-sm text-muted-foreground mt-3">
              Maximum {MAX_AGENTS_PER_DEBATE} agents per debate.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Default Council Mode */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default Council Mode</CardTitle>
          <CardDescription>
            Choose how agents interact during debates by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleModeChange("visible")}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors",
                selectedMode === "visible"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    selectedMode === "visible"
                      ? "border-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedMode === "visible" && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <Label className="font-medium cursor-pointer">Visible</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Agents can see each other&apos;s responses during the debate
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("blind")}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors",
                selectedMode === "blind"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    selectedMode === "blind"
                      ? "border-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedMode === "blind" && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <Label className="font-medium cursor-pointer">Blind</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Agents respond independently without seeing other
                    responses
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving || !dirty || selectedAgents.length < MIN_AGENTS_PER_DEBATE}
        className="w-full"
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {dirty ? "Save Preferences" : "Preferences Saved"}
      </Button>
    </div>
  );
}
