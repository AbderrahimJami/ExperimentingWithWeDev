import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    globals: true,
    css: true,
    include: ["src/test/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: ["tests/e2e/**"],
  },
  server: {
    allowedHosts: [
      // Your ngrok host goes here:
      "krish-spurious-aide.ngrok-free.dev",
      // Or allow *all* hosts (less safe):
      // true
    ],
  },
});
