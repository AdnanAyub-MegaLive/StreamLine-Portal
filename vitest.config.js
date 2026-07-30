import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/events/__tests__/**/*.test.js"],
    coverage: { reporter: ["text", "html"] },
  },
});
