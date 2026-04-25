"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";

type KeyState = "idle" | "testing" | "valid" | "invalid";

const PROVIDER_IDS = [
  "openai",
  "anthropic",
  "google",
  "groq",
  "xai",
  "moonshot",
  "openrouter",
] as const;
type ProviderId = (typeof PROVIDER_IDS)[number];
type KeyField = `${ProviderId}Key`;

interface ProviderConfig {
  id: ProviderId;
  field: KeyField;
  label: string;
  consoleUrl: string;
  placeholder: string;
  footnote?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    field: "openaiKey",
    label: "OpenAI API Key",
    consoleUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    field: "anthropicKey",
    label: "Anthropic API Key",
    consoleUrl: "https://console.anthropic.com",
    placeholder: "sk-ant-...",
  },
  {
    id: "google",
    field: "googleKey",
    label: "Google API Key",
    consoleUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
  },
  {
    id: "groq",
    field: "groqKey",
    label: "Groq API Key",
    consoleUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    footnote:
      "Groq models are free to use. No API key required for basic access. Add your own key for higher rate limits.",
  },
  {
    id: "xai",
    field: "xaiKey",
    label: "XAI (Grok) API Key",
    consoleUrl: "https://console.x.ai",
    placeholder: "xai-...",
  },
  {
    id: "moonshot",
    field: "moonshotKey",
    label: "Moonshot (Kimi) API Key",
    consoleUrl: "https://platform.moonshot.cn",
    placeholder: "sk-...",
  },
  {
    id: "openrouter",
    field: "openrouterKey",
    label: "OpenRouter API Key",
    consoleUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
    footnote:
      "OpenRouter unlocks 300+ models including free-tier Llama / Gemma / Qwen variants.",
  },
];

type KeyMap = Record<KeyField, string>;
type MaskedKeyMap = Record<KeyField, string | null>;
type StatusMap = Record<ProviderId, KeyState>;

const emptyKeys = (): KeyMap =>
  Object.fromEntries(PROVIDERS.map((p) => [p.field, ""])) as KeyMap;

const emptyMasked = (): MaskedKeyMap =>
  Object.fromEntries(PROVIDERS.map((p) => [p.field, null])) as MaskedKeyMap;

const emptyStatus = (): StatusMap =>
  Object.fromEntries(PROVIDERS.map((p) => [p.id, "idle" as KeyState])) as StatusMap;

function readMaskedKeys(data: Partial<Record<KeyField, string | null>>): MaskedKeyMap {
  const out = emptyMasked();
  for (const p of PROVIDERS) {
    out[p.field] = data[p.field] ?? null;
  }
  return out;
}

interface KeyRowProps {
  provider: ProviderConfig;
  value: string;
  masked: string | null;
  state: KeyState;
  onChange: (value: string) => void;
  onTest: () => void;
}

function KeyRow({ provider, value, masked, state, onChange, onTest }: KeyRowProps) {
  let buttonContent: React.ReactNode = "Test";
  if (state === "testing") buttonContent = <Loader2 className="h-4 w-4 animate-spin" />;
  else if (state === "valid") buttonContent = <CheckCircle2 className="h-4 w-4 text-green-500" />;
  else if (state === "invalid") buttonContent = <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={provider.id}>{provider.label}</Label>
        <a
          href={provider.consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Get key <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {masked && (
        <p className="text-sm text-muted-foreground">Current: {masked}</p>
      )}
      <div className="flex gap-2">
        <Input
          id={provider.id}
          type="password"
          placeholder={provider.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button variant="outline" onClick={onTest} disabled={state === "testing"}>
          {buttonContent}
        </Button>
      </div>
      {provider.footnote && (
        <p
          className={
            provider.id === "groq"
              ? "text-xs text-green-600 dark:text-green-400"
              : "text-xs text-muted-foreground"
          }
        >
          {provider.footnote}
        </p>
      )}
    </div>
  );
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<KeyMap>(emptyKeys);
  const [maskedKeys, setMaskedKeys] = useState<MaskedKeyMap>(emptyMasked);
  const [status, setStatus] = useState<StatusMap>(emptyStatus);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => setMaskedKeys(readMaskedKeys(data)))
      .catch(() => {
        // ignore
      });
  }, []);

  const testKey = async (provider: ProviderId, key: string) => {
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }

    setStatus((prev) => ({ ...prev, [provider]: "testing" }));

    try {
      const response = await fetch("/api/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });

      const data = await response.json();

      if (data.valid) {
        setStatus((prev) => ({ ...prev, [provider]: "valid" }));
        toast({ title: "Success", description: data.message });
      } else {
        setStatus((prev) => ({ ...prev, [provider]: "invalid" }));
        toast({
          title: "Invalid Key",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      setStatus((prev) => ({ ...prev, [provider]: "invalid" }));
      toast({
        title: "Error",
        description: "Failed to test API key",
        variant: "destructive",
      });
    }
  };

  const saveKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(keys).filter(([, value]) => value !== "")
          )
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save keys");
      }

      toast({
        title: "Success",
        description: "API keys saved successfully",
      });
      setKeys(emptyKeys());
      const data = await fetch("/api/api-keys").then((res) => res.json());
      setMaskedKeys(readMaskedKeys(data));
    } catch {
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">API Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Manage your provider API keys.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Add your API keys to use your own credits. Keys are encrypted and stored securely.
            If you don&apos;t provide keys, the demo instance keys will be used (with rate limits).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PROVIDERS.map((provider) => (
            <KeyRow
              key={provider.id}
              provider={provider}
              value={keys[provider.field]}
              masked={maskedKeys[provider.field]}
              state={status[provider.id]}
              onChange={(v) => setKeys((prev) => ({ ...prev, [provider.field]: v }))}
              onTest={() => testKey(provider.id, keys[provider.field])}
            />
          ))}

          <Button onClick={saveKeys} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
