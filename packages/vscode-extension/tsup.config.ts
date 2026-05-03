import { defineConfig } from "tsup";

export default defineConfig({
  entry: { extension: "src/extension.ts" },
  format: ["cjs"],
  target: "node18",
  platform: "node",
  external: ["vscode"],
  noExternal: [/@consilium/, /@myconsilium/],
  sourcemap: true,
  clean: true,
  shims: false,
  splitting: false,
  treeshake: true,
});
