#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const source = resolve(repoRoot, "scripts/install.sh");
const target = resolve(here, "../public/install.sh");

if (!existsSync(source)) {
  console.error(`[copy-install-sh] source not found: ${source}`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`[copy-install-sh] ${source} -> ${target}`);
