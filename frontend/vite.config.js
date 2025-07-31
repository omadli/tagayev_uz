import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    brotliSize: false,
    cssCodeSplit: true,
  },
  plugins: [react()],
});
