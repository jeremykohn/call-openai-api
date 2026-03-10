import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "./vitest.shared.config";

/**
 * Vitest configuration for unit tests.
 * Uses happy-dom environment for Vue component testing.
 */
export default defineConfig(
  mergeConfig(sharedConfig, {
    plugins: [vue()],
    test: {
      environment: "happy-dom",
      include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.ui.test.ts"],
    },
  })
);
