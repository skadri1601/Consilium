import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: { version: "19.2" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/gating": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/unsupported-syntax": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/config": "warn",
    },
  },
  {
    files: ["src/**/__tests__/**/*.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "dist/**",
    "out/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "vitest.config.ts",
    "playwright.config.ts",
  ]),
]);

export default config;
