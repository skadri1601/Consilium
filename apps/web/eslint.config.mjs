import nextConfig from "eslint-config-next";

const config = [
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
      "tailwind.config.ts",
      "postcss.config.js",
      "vitest.config.ts",
      "playwright.config.ts",
    ],
  },
  ...nextConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    rules: {
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      // Demoted from error to warn for the eslint-config-next 16 lift.
      // Each violation is a genuine React 19 strict-mode concern that
      // needs per-component refactoring; tracked as a follow-up.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
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
];

export default config;
