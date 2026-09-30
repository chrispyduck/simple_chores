import { defineConfig } from "vite";

// Separate build from vite.config.ts: the Lovelace history card is a small,
// read-only, non-admin bundle that shouldn't ship (or force every dashboard
// load to fetch) the much larger admin panel's CRUD code. Run after the
// panel build, so emptyOutDir here must stay false or it'd wipe that output.
export default defineConfig({
  build: {
    lib: {
      entry: "src/history-card-main.ts",
      formats: ["es"],
      fileName: () => "simple-chores-history-card.js",
    },
    outDir: "../custom_components/simple_chores/frontend/dist",
    emptyOutDir: false,
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
