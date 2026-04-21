import { randomBytes } from "node:crypto";

export type IdPrefix = "dbt" | "cnv" | "msg" | "log";

const VALID_PREFIXES = new Set<string>(["dbt", "cnv", "msg", "log"]);

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function parseId(id: string): { prefix: string; randomPart: string } {
  const separatorIndex = id.indexOf("_");
  if (separatorIndex === -1) {
    throw new Error(`Invalid prefixed ID: ${id}`);
  }

  const prefix = id.substring(0, separatorIndex);
  const randomPart = id.substring(separatorIndex + 1);

  if (!VALID_PREFIXES.has(prefix)) {
    throw new Error(`Unknown ID prefix: ${prefix}`);
  }

  return { prefix, randomPart };
}
