import { defineConfig } from "vite";

export default defineConfig({
  base: "/draw-map-boundaries/",
  build: {
    outDir: "./docs",
    emptyOutDir: true,
  },
});
