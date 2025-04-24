import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/client.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false, // We'll use tsc for declaration files
  format: ["cjs", "esm"],
  external: ["@prisma/client"],
  noExternal: [],
  legacyOutput: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    options.keepNames = true;
  },
});
