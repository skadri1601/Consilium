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
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";
import { useUserPreferences } from "@/shared/hooks/use-user-preferences";
import { AGENTS, MIN_AGENTS_PER_DEBATE, MAX_AGENTS_PER_DEBATE } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { DebateModeSelector } from "@/features/council/components/debate-mode-selector";
import type { CouncilMode } from "@/features/council/types/council.types";

export function PreferencesSettings() {
  const { preferences, updatePreferences, isLoaded } = useUserPreferences();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<CouncilMode>("council");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();

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

  const handleModeChange = (mode: CouncilMode) => {
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default Council Mode</CardTitle>
          <CardDescription>
            Choose how agents interact during debates by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DebateModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
          />
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
