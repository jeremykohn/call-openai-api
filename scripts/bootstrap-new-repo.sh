#!/usr/bin/env bash
# Bootstrap script for compare-openai-models
# Run from /workspaces: bash call-openai-api/scripts/bootstrap-new-repo.sh
set -euo pipefail

REPO_NAME="compare-openai-models"
SOURCE_REPO="call-openai-api"
WORKSPACES_DIR="/workspaces"
SOURCE="$WORKSPACES_DIR/$SOURCE_REPO"
DEST="$WORKSPACES_DIR/$REPO_NAME"

if [[ ! -d "$SOURCE" ]]; then
  echo "❌ Source repo not found: $SOURCE"
  exit 1
fi

if [[ -e "$DEST" ]]; then
  echo "❌ Destination already exists: $DEST"
  echo "   Remove it first or change REPO_NAME in this script."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Scaffold new Nuxt 4 app
# ---------------------------------------------------------------------------
echo "==> Creating $REPO_NAME in $WORKSPACES_DIR ..."
cd "$WORKSPACES_DIR"
npx nuxi@latest init "$REPO_NAME" --package-manager npm --no-install --no-gitInit
cd "$DEST"
git init
git add -A
if git config user.name >/dev/null 2>&1 && git config user.email >/dev/null 2>&1; then
  git commit -m "chore: scaffold Nuxt 4 app"
else
  echo "⚠️  Skipping initial commit (git user.name/user.email not configured)."
fi

# ---------------------------------------------------------------------------
# 2. Write package.json (mirrors call-openai-api, name updated)
# ---------------------------------------------------------------------------
echo "==> Writing package.json ..."
cat > package.json << 'PKGJSON'
{
  "name": "compare-openai-models",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxi prepare && tsc --noEmit",
    "lint": "npm run typecheck && eslint . && prettier --check .",
    "lint:fix": "eslint . --fix && prettier --write .",
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.config.ts --dir tests/integration",
    "test:e2e": "playwright test",
    "test:a11y:unit": "vitest run --config vitest.unit.config.ts tests/unit/app.a11y.test.ts",
    "test:a11y:e2e": "playwright test tests/e2e/accessibility.spec.ts",
    "test:a11y": "npm run test:a11y:unit && npm run test:a11y:e2e"
  },
  "dependencies": {
    "nuxt": "^4.0.0"
  },
  "overrides": {
    "serialize-javascript": "^7.0.4"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.11.1",
    "@nuxt/eslint": "^1.15.2",
    "@nuxt/test-utils": "^3.11.0",
    "@nuxtjs/tailwindcss": "^6.14.0",
    "@playwright/test": "^1.49.1",
    "@types/node": "^22.10.2",
    "@vitejs/plugin-vue": "^6.0.4",
    "@vue/test-utils": "^2.4.6",
    "autoprefixer": "^10.4.24",
    "eslint": "^9.39.4",
    "happy-dom": "^20.5.0",
    "postcss": "^8.5.6",
    "prettier": "^3.8.1",
    "tailwindcss": "^3.4.19",
    "typescript": "^5.7.2",
    "vitest": "^3.2.4",
    "vitest-axe": "^0.1.0"
  }
}
PKGJSON

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
echo "==> Installing dependencies ..."
npm install
if ! npx playwright install --with-deps chromium; then
  echo "⚠️  Playwright OS dependency install failed; falling back to browser-only install."
  npx playwright install chromium
fi

# ---------------------------------------------------------------------------
# 4. Write toolchain config files
# ---------------------------------------------------------------------------
echo "==> Writing nuxt.config.ts ..."
cat > nuxt.config.ts << 'EOF'
/// <reference types="nuxt" />
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-02-05",
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    openaiAllowedHosts: process.env.OPENAI_ALLOWED_HOSTS ?? "api.openai.com",
    openaiAllowInsecureHttp: process.env.OPENAI_ALLOW_INSECURE_HTTP ?? "false",
    openaiDisableModelsCache:
      process.env.OPENAI_DISABLE_MODELS_CACHE ?? "false",
  },
  css: ["~/assets/main.css"],
  typescript: {
    strict: true,
  },
});
EOF

echo "==> Writing nitro.config.ts ..."
cat > nitro.config.ts << 'EOF'
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "vercel",
});
EOF

echo "==> Writing tsconfig.json ..."
cat > tsconfig.json << 'EOF'
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "types": ["nuxt"]
  },
  "include": [
    "app",
    "server",
    "tests",
    "types",
    "nuxt.config.ts",
    "nitro.config.ts",
    "playwright.config.ts",
    "vitest.config.ts",
    "vitest.unit.config.ts",
    "types/**/*.d.ts"
  ]
}
EOF

echo "==> Writing tailwind.config.ts ..."
cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./server/**/*.{ts,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
EOF

echo "==> Writing eslint.config.mjs ..."
cat > eslint.config.mjs << 'EOF'
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
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
    },
  })
  .append({
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    rules: {
      "no-console": "off",
    },
  });
EOF

echo "==> Writing vitest.shared.config.ts ..."
cat > vitest.shared.config.ts << 'EOF'
import { fileURLToPath } from "node:url";

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
EOF

echo "==> Writing vitest.config.ts ..."
cat > vitest.config.ts << 'EOF'
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "./vitest.shared.config";

export default defineConfig(
  mergeConfig(sharedConfig, {
    test: {
      environment: "node",
      fileParallelism: false,
      maxWorkers: 1,
      minWorkers: 1,
    },
  }),
);
EOF

echo "==> Writing vitest.unit.config.ts ..."
cat > vitest.unit.config.ts << 'EOF'
import vue from "@vitejs/plugin-vue";
import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "./vitest.shared.config";

export default defineConfig(
  mergeConfig(sharedConfig, {
    plugins: [vue()],
    test: {
      environment: "happy-dom",
      include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.ui.test.ts"],
    },
  }),
);
EOF

echo "==> Writing playwright.config.ts ..."
cat > playwright.config.ts << 'EOF'
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
EOF

echo "==> Writing .vale.ini ..."
cat > .vale.ini << 'EOF'
StylesPath = .github/styles
MinAlertLevel = suggestion

[*]
BasedOnStyles = Vale
EOF

echo "==> Writing .textlintrc.json ..."
cat > .textlintrc.json << 'EOF'
{
  "rules": {
    "ginger": true
  }
}
EOF

echo "==> Writing .env.example ..."
cat > .env.example << 'EOF'
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_ALLOWED_HOSTS=api.openai.com
EOF

# ---------------------------------------------------------------------------
# 5. Copy policy and convention files from source repo
# ---------------------------------------------------------------------------
echo "==> Copying .github policy and convention files ..."
mkdir -p .github/instructions .github/workflows .github/styles

cp "$SOURCE/.github/copilot-instructions.md"       .github/copilot-instructions.md
cp "$SOURCE/.github/dependabot.yml"                .github/dependabot.yml
for instruction_file in "$SOURCE"/.github/instructions/*.md; do
  [[ -f "$instruction_file" ]] || continue
  cp "$instruction_file" .github/instructions/
done
cp "$SOURCE/.github/workflows/ci.yml"              .github/workflows/ci.yml
cp "$SOURCE/.github/workflows/codeql.yml"          .github/workflows/codeql.yml
cp "$SOURCE/.github/workflows/npm-audit.yml"       .github/workflows/npm-audit.yml
cp "$SOURCE/.github/workflows/markdown-grammar-checker.yml" .github/workflows/markdown-grammar-checker.yml
if [[ -d "$SOURCE/.github/styles" ]]; then
  cp -r "$SOURCE/.github/styles/." .github/styles/
fi

echo "==> Copying COPYRIGHT.md ..."
cp "$SOURCE/COPYRIGHT.md" COPYRIGHT.md

echo "==> Copying .gitignore ..."
cp "$SOURCE/.gitignore" .gitignore

# ---------------------------------------------------------------------------
# 6. Create minimal required directories and placeholder files
# ---------------------------------------------------------------------------
echo "==> Creating test directory scaffolding ..."
mkdir -p tests/unit tests/integration tests/e2e

cat > tests/test-setup.ts << 'EOF'
// Global test setup — add vitest-axe matchers or other globals here.
EOF

mkdir -p app/assets
touch app/assets/main.css

# ---------------------------------------------------------------------------
# 7. Update copilot-instructions.md repo name
# ---------------------------------------------------------------------------
echo "==> Updating repo name in copilot-instructions.md ..."
sed -i 's/Call OpenAI API/Compare OpenAI Models/g; s/call-openai-api/compare-openai-models/g' \
  .github/copilot-instructions.md

# ---------------------------------------------------------------------------
# 8. Run nuxi prepare so .nuxt/tsconfig.json exists for typecheck
# ---------------------------------------------------------------------------
echo "==> Running nuxi prepare ..."
npx nuxi prepare

# ---------------------------------------------------------------------------
# 9. Verification
# ---------------------------------------------------------------------------
echo "==> Running typecheck ..."
npm run typecheck

echo "==> Running lint ..."
npm run lint

echo ""
echo "✅ Bootstrap complete."
echo "   Repo is at: $DEST"
echo "   Next steps:"
echo "     1. cd $DEST"
echo "     2. cp .env.example .env  # then fill in OPENAI_API_KEY"
echo "     3. npm run dev"
echo "     4. File > Add Folder to Workspace in VS Code to open both repos side by side"
