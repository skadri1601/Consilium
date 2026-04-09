import eslint from "@eslint/js";
import tseslintParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "node_modules/"],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tseslintParser,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
