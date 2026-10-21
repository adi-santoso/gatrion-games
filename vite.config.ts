import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const PREVIEW_HOST = "pv-90c4d1a3447f-31c662d9-e899-4692-896d-a8d561c57ce1.style.dev";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    // dev-preview Cloud butuh host ini; jangan pernah pakai allowedHosts: true
    allowedHosts: [PREVIEW_HOST],
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [PREVIEW_HOST],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
