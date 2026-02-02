"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";

interface ApiKeyStatus {
  openai: "idle" | "testing" | "valid" | "invalid";
  anthropic: "idle" | "testing" | "valid" | "invalid";
  google: "idle" | "testing" | "valid" | "invalid";
  groq: "idle" | "testing" | "valid" | "invalid";
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState({
    openaiKey: "",
    anthropicKey: "",
    googleKey: "",
    groqKey: "",
  });
  const [maskedKeys, setMaskedKeys] = useState({
    openaiKey: null as string | null,
    anthropicKey: null as string | null,
    googleKey: null as string | null,
    groqKey: null as string | null,
  });
  const [status, setStatus] = useState<ApiKeyStatus>({
    openai: "idle",
    anthropic: "idle",
    google: "idle",
    groq: "idle",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch current keys (masked)
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => {
        setMaskedKeys({
          openaiKey: data.openaiKey,
          anthropicKey: data.anthropicKey,
          googleKey: data.googleKey,
          groqKey: data.groqKey,
        });
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const testKey = async (provider: "openai" | "anthropic" | "google" | "groq", key: string) => {
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
        body: JSON.stringify({
          provider,
          key,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setStatus((prev) => ({ ...prev, [provider]: "valid" }));
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        setStatus((prev) => ({ ...prev, [provider]: "invalid" }));
        toast({
          title: "Invalid Key",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
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
        body: JSON.stringify(keys),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API keys saved successfully",
        });
        // Clear input fields
        setKeys({ openaiKey: "", anthropicKey: "", googleKey: "", groqKey: "" });
        // Refresh masked keys
        const data = await fetch("/api/api-keys").then((res) => res.json());
        setMaskedKeys({
          openaiKey: data.openaiKey,
          anthropicKey: data.anthropicKey,
          googleKey: data.googleKey,
          groqKey: data.groqKey,
        });
      } else {
        throw new Error("Failed to save keys");
      }
    } catch (error) {
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
            If you don't provide keys, the demo instance keys will be used (with rate limits).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai">OpenAI API Key</Label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {maskedKeys.openaiKey && (
              <p className="text-sm text-muted-foreground">
                Current: {maskedKeys.openaiKey}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                id="openai"
                type="password"
                placeholder="sk-..."
                value={keys.openaiKey}
                onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => testKey("openai", keys.openaiKey)}
                disabled={status.openai === "testing"}
              >
                {status.openai === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status.openai === "valid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : status.openai === "invalid" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anthropic">Anthropic API Key</Label>
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {maskedKeys.anthropicKey && (
              <p className="text-sm text-muted-foreground">
                Current: {maskedKeys.anthropicKey}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                id="anthropic"
                type="password"
                placeholder="sk-ant-..."
                value={keys.anthropicKey}
                onChange={(e) => setKeys({ ...keys, anthropicKey: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => testKey("anthropic", keys.anthropicKey)}
                disabled={status.anthropic === "testing"}
              >
                {status.anthropic === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status.anthropic === "valid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : status.anthropic === "invalid" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          {/* Google */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="google">Google API Key</Label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {maskedKeys.googleKey && (
              <p className="text-sm text-muted-foreground">
                Current: {maskedKeys.googleKey}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                id="google"
                type="password"
                placeholder="AIza..."
                value={keys.googleKey}
                onChange={(e) => setKeys({ ...keys, googleKey: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => testKey("google", keys.googleKey)}
                disabled={status.google === "testing"}
              >
                {status.google === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status.google === "valid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : status.google === "invalid" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          {/* Groq */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groq">Groq API Key</Label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {maskedKeys.groqKey && (
              <p className="text-sm text-muted-foreground">
                Current: {maskedKeys.groqKey}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                id="groq"
                type="password"
                placeholder="gsk_..."
                value={keys.groqKey}
                onChange={(e) => setKeys({ ...keys, groqKey: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => testKey("groq", keys.groqKey)}
                disabled={status.groq === "testing"}
              >
                {status.groq === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status.groq === "valid" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : status.groq === "invalid" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>
          </div>

          <Button onClick={saveKeys} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
