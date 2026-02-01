"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Terminal, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";

export function CliTokenSettings() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateToken = async () => {
    setLoading(true);
    setToken(null);
    try {
      const response = await fetch("/api/api-keys/cli-token", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate token");
      }
      setToken(data.token);
      toast({
        title: "CLI token generated",
        description: "Copy it and run: consilium config set apiKey \"<token>\"",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate CLI token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Copy the token manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Consilium CLI</h2>
        <p className="text-sm text-muted-foreground">
          Generate a token to use the Consilium CLI. Sign in here first, then use this token in the CLI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            CLI token
          </CardTitle>
          <CardDescription>
            Use this token in the CLI so you can run debates and chat without signing in again.
            Generate a new token anytime; the previous one will stop working.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={generateToken} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate CLI token
            </Button>
            {token && (
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
            )}
          </div>
          {token && (
            <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
              {token}
            </div>
          )}
          <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">In the CLI, run:</p>
            <code className="block mt-1 text-foreground">
              consilium config set apiKey &quot;{token ? "your-token-here" : "consilium_..."}&quot;
            </code>
            <p className="mt-2">
              Or use <code className="text-foreground">/api</code> in the interactive chat to set or view your API key.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
