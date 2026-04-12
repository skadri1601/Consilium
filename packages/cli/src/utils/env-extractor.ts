import fs from "node:fs";
import path from "node:path";

const SERVICE_KEYWORDS: Record<string, string[]> = {
  stripe: ["STRIPE"],
  clerk: ["CLERK", "NEXT_PUBLIC_CLERK"],
  redis: ["REDIS", "UPSTASH"],
  postgresql: ["DATABASE_URL", "POSTGRES", "PG_"],
  sentry: ["SENTRY"],
  openai: ["OPENAI"],
  anthropic: ["ANTHROPIC"],
  google: ["GOOGLE_API", "GOOGLE_CLOUD"],
  vercel: ["VERCEL"],
  aws: ["AWS_"],
  supabase: ["SUPABASE"],
  firebase: ["FIREBASE"],
  twilio: ["TWILIO"],
  sendgrid: ["SENDGRID"],
  slack: ["SLACK"],
  linear: ["LINEAR"],
  github: ["GITHUB_TOKEN", "GH_TOKEN"],
  docker: ["DOCKER"],
  neon: ["NEON"],
};

export interface EnvMetadata {
  integrations: string[];
  variableCount: number;
}

export function extractEnvMetadata(projectDir: string): EnvMetadata | null {
  const envFiles = [".env", ".env.local", ".env.example", ".env.development"];
  const foundVars = new Set<string>();
  const integrations = new Set<string>();

  for (const envFile of envFiles) {
    const fullPath = path.join(projectDir, envFile);
    try {
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex <= 0) continue;
        const varName = trimmed.slice(0, eqIndex).trim();
        foundVars.add(varName);

        for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
          if (keywords.some((kw) => varName.startsWith(kw))) {
            integrations.add(service);
          }
        }
      }
    } catch {}
  }

  if (foundVars.size === 0) return null;

  return {
    integrations: Array.from(integrations).sort(),
    variableCount: foundVars.size,
  };
}
