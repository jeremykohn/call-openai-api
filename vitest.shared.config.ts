import { fileURLToPath } from "node:url";

/**
 * Shared Vitest configuration for all test types.
 * Contains common settings used by both unit and integration test configs.
 */
export const sharedConfig = {
  resolve: {
    alias: {
      "~~": fileURLToPath(new URL(".", import.meta.url)),
      "~": fileURLToPath(new URL("./app", import.meta.url)),
      "#imports": fileURLToPath(new URL("./app/auto-imports", import.meta.url)),
    },
  },
  test: {
    globals: true,
    setupFiles: ["tests/test-setup.ts"],
  },
};
