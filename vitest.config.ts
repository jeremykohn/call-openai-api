import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "./vitest.shared.config";

/**
 * Vitest configuration for integration tests.
 * Uses Node environment for testing API endpoints and server logic.
 */
export default defineConfig(
  mergeConfig(sharedConfig, {
    test: {
      environment: "node",
    },
  })
);
