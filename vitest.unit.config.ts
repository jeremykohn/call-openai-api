import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["tests/test-setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.ui.test.ts"]
  }
});
