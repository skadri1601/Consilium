// ESLint 9 flat-config shim — bridges the legacy Next.js eslint preset into
// the flat-config world because `next lint` was removed in Next.js 16 and
// ESLint 9 no longer reads .eslintrc.json.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "out/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
      // Config files use CommonJS require() which Next.js's flat preset
      // flags; they pre-date the migration and aren't shipping to users.
      "tailwind.config.ts",
      "postcss.config.js",
      "vitest.config.ts",
      "playwright.config.ts",
    ],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      // Demote nits to warnings so they don't block CI; real errors still fail.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  }),
];
