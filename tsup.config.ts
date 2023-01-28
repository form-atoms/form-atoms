import { defineConfig } from "tsup";

import tsconfig from "./tsconfig.json";

export default defineConfig({
  name: "form-atoms",
  entry: ["src/index.tsx", "src/zod.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  external: ["zod"],
  target: tsconfig.compilerOptions.target,
});
