"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Terminal, Copy, Loader2, CheckCircle2 } from "lucide-react";

export default function CliAuthPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const generateToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/api-keys/cli-token", {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate token");
        }
        setToken(data.token);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate token"
        );
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, [isLoaded, isSignedIn]);

  const copyToClipboard = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4 pt-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Consilium CLI Setup
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            Sign in to generate a CLI authentication token.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              card: "shadow-lg",
            },
          }}
          fallbackRedirectUrl="/cli/auth"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 pt-24 pb-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Terminal className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Consilium CLI Setup
        </h1>
        <p className="text-muted-foreground text-sm">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? user?.fullName}
          </span>
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4" />
            CLI Token
            {token && (
              <Badge variant="secondary" className="ml-auto">
                Ready
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {token && (
            <>
              <div className="rounded-md bg-muted p-4 font-mono text-sm break-all select-all leading-relaxed">
                {token}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Paste this token in your terminal to complete setup.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
