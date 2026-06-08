import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({
    projects: ["./tsconfig.json"],
  }), react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
    ],
    environment: "jsdom",
  },
});
