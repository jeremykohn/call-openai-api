// @ts-check
import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: {
    typescript: {
      strict: true,
    },
    stylistic: false, // Using Prettier for formatting
  },
})
  .append({
    ignores: [
      "LanguageTool-6.4/**",
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/dist/**",
      "**/coverage/**",
      "**/test-results/**",
    ],
  })
  .append({
    rules: {
      // Customize rules as needed
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
    },
  })
  .append({
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    rules: {
      "no-console": "off", // Allow console in scripts
    },
  });
