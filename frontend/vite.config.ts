import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "simple-chores-panel.js",
    },
    outDir: "../custom_components/simple_chores/frontend/dist",
    emptyOutDir: true,
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
