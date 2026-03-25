# Product Overview

## Purpose
`call-openai-api` is a Nuxt 4 web app that lets a user:
1. select an OpenAI model from a server-provided list,
2. submit a text prompt,
3. view the generated response or a normalized error state.

The app emphasizes:
- safe server-side OpenAI access,
- deterministic model list behavior,
- clear loading/error UX,
- basic accessibility and keyboard support.

## Core User Flow
1. User opens `/`.
2. App auto-fetches models from `GET /api/models`.
3. User optionally selects a model (or leaves default behavior).
4. User enters prompt (required, max 4000 chars after trim).
5. User submits.
6. App calls `POST /api/respond`.
7. App shows:
   - loading spinner/status,
   - success response,
   - or normalized error alert with optional details toggle.

---

# Functional Requirements

## Prompt Submission
- **FR-001**: The app MUST render a prompt `<textarea>` labeled `Prompt`.
- **FR-002**: Prompt MUST be validated client-side using trimmed content.
- **FR-003**: Empty or whitespace-only prompt MUST fail with `Please enter a prompt.` and focus the prompt field.
- **FR-004**: Prompt length MUST be limited to 4000 chars (`maxlength=4000`) and validation MUST reject trimmed input over 4000 with `Prompt must be 4000 characters or fewer.`.
- **FR-005**: Submit button text MUST be `Send`.
- **FR-006**: While submitting, button MUST be disabled and `aria-busy="true"`.

## Model Selection
- **FR-007**: Model selector MUST be populated from `GET /api/models`.
- **FR-008**: Selector MUST display placeholder:
  - `Select a model` when models exist,
  - `No models available` when empty.
- **FR-009**: If no model is selected, client MUST omit `model` from `/api/respond` request body.
- **FR-010**: Server MUST resolve omitted/empty `model` to `DEFAULT_MODEL = gpt-4.1-mini`.
- **FR-011**: If model is selected, request MUST include `model`.
- **FR-012**: Selected model MUST be validated server-side against upstream `/models` list; unknown model MUST return `400` with message `Model is not valid`.
- **FR-013**: If model validation cannot be performed (e.g., upstream `/models` unavailable), server MUST return `502` with `Unable to validate model right now. Please try again.`

## Models API Behavior
- **FR-014**: `GET /api/models` MUST proxy OpenAI `/models`, then apply local config filtering behavior.
- **FR-015**: Filtering MUST exclude only IDs listed in:
  - `models-with-error`
  - `models-with-no-response`
- **FR-016**: IDs in `available-models` and `other-models` MUST NOT be excluded.
- **FR-017**: Final models list MUST always be sorted alphabetically by `id`.
- **FR-018**: Response MUST include metadata:
  - `usedConfigFilter: boolean`
  - `showFallbackNote: boolean`
- **FR-019**: If config file is missing/unreadable/malformed/invalid, route MUST fallback to full upstream list and set:
  - `usedConfigFilter = false`
  - `showFallbackNote = true`
- **FR-020**: If config is valid, route MUST set:
  - `usedConfigFilter = true`
  - `showFallbackNote = false`

## Respond API Behavior
- **FR-021**: `POST /api/respond` MUST accept `{ prompt: string, model?: string }`.
- **FR-022**: Successful response MUST return `{ response: string, model: string }`.
- **FR-023**: Upstream non-OK status MUST return same status (or 500 fallback) with:
  - `message: "Request to OpenAI failed."`
  - optional sanitized `details`.
- **FR-024**: Unexpected server exceptions in respond route MUST return `500` with same message and sanitized details when available.

## Error UX
- **FR-025**: Client errors MUST normalize to categories:
  - `network`
  - `api`
  - `unknown`
- **FR-026**: Network failures MUST show:
  `Network error: Unable to reach OpenAI. Please check your internet connection and try again.`
- **FR-027**: API failures MUST show API message (sanitized), with optional details hidden behind toggle.
- **FR-028**: Unknown failures MUST show:
  `An unexpected error occurred. Please try again or contact support.`
- **FR-029**: Error details MUST be collapsed by default when toggle is enabled; toggle labels MUST be `Show details` / `Hide details`.

---

# Non-Functional Requirements

## Reliability and Determinism
- Models list sorting MUST be deterministic (`localeCompare`-based alphabetical sort).
- Config serialization for model config scripts/utilities MUST preserve canonical key order and trailing newline.
- Caching MUST behave deterministically by base URL key.

## Performance
- Server model validation cache TTL: **5 minutes** (`openai-model-validation.ts`).
- Server models-response cache TTL: **24 hours** (`models-response-cache.ts`), with stale-while-revalidate behavior.
- UI should remain responsive with visible loading states for models and response requests.

## Maintainability
- TypeScript strict mode enabled.
- Shared constants and types centralized (`shared/constants`, `types`).
- Error normalization/sanitization separated into dedicated utils.

## Compatibility
- Nuxt 4 + Vue 3 composition API.
- Tailwind CSS utility styling.
- Target deployment: Vercel Nitro preset.

---

# System Architecture

## High-Level Layers
| Layer | Path | Responsibility |
|---|---|---|
| UI | `app/` | Form, selector, loading/success/error rendering, client validation, UX/accessibility |
| API routes | `server/api/` | Secure OpenAI proxying, config filtering, model resolution |
| Server utils | `server/utils/` | Security validation, cache, parsing, config loading/filtering |
| Shared constants | `shared/constants/` | Default model and fallback-note copy |
| Types | `types/`, `server/types/` | Client/server contracts and OpenAI payload shapes |
| Tests | `tests/` | Unit, integration, e2e, accessibility verification |

## Runtime Request Sequence (Respond)
1. UI validates prompt (`app/utils/prompt-validation.ts`).
2. UI sends `POST /api/respond`.
3. Route validates prompt again server-side.
4. Route validates runtime OpenAI config + allowed host.
5. Route resolves model (selected or default, with `/models` validation).
6. Route calls OpenAI `/responses`.
7. Route extracts response text and returns `{ response, model }` or stable error contract.
8. UI normalizes any failure and renders `UiErrorAlert`.

## Runtime Request Sequence (Models)
1. UI composable `useModelsState()` auto-fetches `GET /api/models`.
2. Route validates config/host security.
3. Route serves fresh cache, stale cache + background refresh, or upstream fetch.
4. Route applies config filtering (or fallback mode).
5. UI shows selector and optional fallback note.

---

# API and Data Contracts

## `POST /api/respond`
### Request
```json
{
  "prompt": "string (required, trimmed, max 4000)",
  "model": "string (optional)"
}
```

### Success (`200`)
```json
{
  "response": "string",
  "model": "string"
}
```

### Error (`400`, `500`, `502`, upstream status passthrough)
```json
{
  "message": "string",
  "details": "string (optional)"
}
```

### Rules
- `400` for invalid prompt.
- `400` for invalid selected model.
- `502` when selected-model validation is temporarily unavailable.
- Upstream OpenAI non-OK typically mirrors upstream status with stable message and sanitized details.
- Unhandled failures return `500`.

---

## `GET /api/models`
### Success
```json
{
  "object": "list",
  "data": [
    {
      "id": "string",
      "object": "model",
      "created": 0,
      "owned_by": "string"
    }
  ],
  "usedConfigFilter": true,
  "showFallbackNote": false
}
```

### Error
```json
{
  "message": "Error: Failed API call, could not get list of OpenAI models",
  "details": "string (optional)"
}
```

### Models Config Schema (`server/assets/models/openai-models.json`)
```json
{
  "available-models": ["string"],
  "models-with-error": ["string"],
  "models-with-no-response": ["string"],
  "other-models": ["string"]
}
```

### Config Parsing Rules
- Root MUST be object.
- All four keys required.
- Each key value MUST be array of strings.
- Invalid format triggers fallback mode.

### Filtering Rules
- Exclude set = union of:
  - `models-with-error`
  - `models-with-no-response`
- `available-models` and `other-models` are informational/non-exclusion.

---

# UI/UX Specification

## Page Structure
- Single-page layout in `app/app.vue`:
  - gradient full-height page container,
  - centered header with title/subtitle,
  - card-style form section,
  - response state section,
  - legal footer with terms/privacy links.

## Header
- Title: `ChatGPT prompt tester`
- Subtitle: `Send a prompt and see the response.`

## Form
- `ModelsSelector` component:
  - label `Model`,
  - required indicator `*` when required,
  - loading state with spinner text `Loading models...`,
  - disabled/error behavior and retry.
- Prompt field:
  - `<textarea>` with helper text `Maximum 4000 characters.`
  - inline validation alert below prompt when invalid.
- Submit:
  - rounded primary button `Send`.

## Response Area
- **Loading**: spinner + `Waiting for response from ChatGPT...`
- **Success**: card with heading `Response` and pre-wrap text.
- **Error**: `UiErrorAlert` with title `Something went wrong`, message, optional details toggle.

## Models Selector UX Details
- On success with data: selectable options + default placeholder.
- On no models: select disabled + `No models available` option.
- On error: select shown but disabled; error alert rendered with retry button (`Try again`).
- Fallback note shown only when `showFallbackNote=true`:
  `Note: List of OpenAI models may include some older models that are no longer available.`
- Helper text always shown in non-loading states:
  `Uses gpt-4.1-mini by default if none is selected.`

---

# Styling and Design System

## Framework
- Tailwind CSS (`@nuxtjs/tailwindcss`), directives in `app/assets/main.css`.
- No custom theme tokens beyond default Tailwind palette.

## Visual Language
- Background: light slate gradient (`from-slate-50 via-white to-slate-100`).
- Surface: rounded white/glass cards with subtle borders/shadows.
- Primary action: blue (`bg-blue-600`, hover blue-700).
- Success state: emerald (`bg-emerald-50`, border-emerald-200`).
- Error state: red (`bg-red-50`, border-red-200`).

## Layout and Responsiveness
- Main content max width `max-w-3xl`.
- Header text scales (`text-3xl` to `sm:text-4xl`).
- Responsive spacing via Tailwind utility classes.
- Form and state sections use grid/flex with consistent gap spacing.

## Focus and Interaction Styling
- Inputs/links/buttons use `focus-visible:outline` + color-specific focus rings.
- Disabled controls use muted background/text and `cursor-not-allowed`.

---

# State Management and Client Logic

## `useRequestState` (`app/composables/use-request-state.ts`)
State shape:
```ts
{
  status: "idle" | "loading" | "success" | "error",
  data: string | null,
  error: string | null,
  errorDetails: string | null
}
```
Methods: `start`, `succeed`, `fail`, `reset`.

## `useModelsState` (`app/composables/use-models-state.ts`)
State shape:
```ts
{
  status: "idle" | "loading" | "success" | "error",
  data: OpenAIModel[] | null,
  usedConfigFilter: boolean,
  showFallbackNote: boolean,
  error: string | null,
  errorDetails: string | null
}
```
Behavior:
- Auto-fetches on client init (skips SSR).
- Uses request-id strategy + `AbortController` to prevent stale updates.
- Normalizes/logs errors via shared error utils.
- Exposes `fetchModels` for retry.

## App Submit Logic (`app/app.vue`)
- Prevent re-submit while loading.
- Validate prompt before request.
- Build body `{ prompt }` and add `model` only if selected.
- On success call `succeed(response.response)`.
- On failure normalize/log then `fail(message, details)`.

---

# Error Handling and Empty States

## Error Normalization (`app/utils/error-normalization.ts`)
- `network`: deterministic canonical message, no details.
- `api`: message from API payload or fallback `Request to OpenAI failed.`, optional details.
- `unknown`: canonical unknown message with sanitized details if available.

## Sanitization (`app/utils/error-sanitization.ts`)
Must redact:
- `Bearer <token>`
- `Authorization: ...` header values
- OpenAI-style API keys `sk-...`

## Empty States
- No models available: disabled select + placeholder `No models available`.
- Prompt invalid: inline `role="alert"` error and focus on prompt.
- Missing/invalid model config: fallback note displayed and full upstream list used.

---

# Security Requirements

## Secrets and Boundaries
- `OPENAI_API_KEY` must be server-only (`runtimeConfig.openaiApiKey`).
- Client never directly calls OpenAI; only server routes proxy requests.

## Allowed Host Enforcement
- `OPENAI_BASE_URL` must pass allowlist check against parsed `OPENAI_ALLOWED_HOSTS`.
- By default, `http` is rejected unless `OPENAI_ALLOW_INSECURE_HTTP` parses truthy.
- URL with credentials is rejected.
- Invalid allowlist entries invalidate config.

## Config Validation
- Missing/empty API key => server error.
- Empty allowlist => server error.
- Invalid allowlist entries => server error.

## Error Detail Hygiene
- Upstream/raw errors are sanitized before returning/logging details.

---

# Accessibility Requirements

## Implemented Requirements
- Skip link at top of page (`Skip to main`).
- Main landmark target `id="maincontent"`.
- Prompt error uses `role="alert"`.
- Error alert component uses `role="alert"`.
- Loading/status regions use `aria-live`/`role="status"` where appropriate.
- Form controls expose `aria-required`, `aria-invalid`, and `aria-describedby`.
- Keyboard-operable details and retry buttons.
- Focus-visible styles on interactive controls.
- Automated axe checks (unit + e2e) target WCAG A/AA tags.

## Behavioral Requirements
- Error details must remain hidden by default until user toggles.
- Retry button and details toggle must be reachable and operable via keyboard.

---

# Configuration and Environment

## Runtime Config (`nuxt.config.ts`)
| Runtime key | Env source | Default |
|---|---|---|
| `openaiApiKey` | `OPENAI_API_KEY` | `""` |
| `openaiBaseUrl` | `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `openaiAllowedHosts` | `OPENAI_ALLOWED_HOSTS` | `api.openai.com` |
| `openaiAllowInsecureHttp` | `OPENAI_ALLOW_INSECURE_HTTP` | `"false"` |
| `openaiDisableModelsCache` | `OPENAI_DISABLE_MODELS_CACHE` | `"false"` |

Additional env used by validation util:
- `OPENAI_DISABLE_MODEL_VALIDATION_CACHE` (process-level toggle in `openai-model-validation.ts`).

## Required Minimum Env
- `OPENAI_API_KEY`
- `OPENAI_ALLOWED_HOSTS` must contain valid host entries.
- If using local HTTP mock servers: set `OPENAI_ALLOW_INSECURE_HTTP=true`.

## Local Config File
- `server/assets/models/openai-models.json` is optional but expected for filtered behavior.
- Missing/invalid file triggers fallback mode.

---

# Setup, Run, and Usage

## Prerequisites
- Node.js 20+ (recommended by README).
- npm.
- OpenAI API key.

## Install
```bash
npm install
```

## Environment
```bash
cp .env.example .env
```

Set in `.env`:
```bash
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ALLOWED_HOSTS=api.openai.com
```

Optional:
```bash
OPENAI_ALLOW_INSECURE_HTTP=false
OPENAI_DISABLE_MODELS_CACHE=false
OPENAI_DISABLE_MODEL_VALIDATION_CACHE=false
```

## Development
```bash
npm run dev
```

## Build / Preview
```bash
npm run build
npm run preview
```

## Quality / Test Commands
```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:a11y
```

---

# Testing and Quality Gates

## Test Layers
- **Unit (`tests/unit`)**:
  - composables state transitions,
  - prompt validation,
  - error normalization/sanitization/logging,
  - security utility parsing/validation,
  - models config parsing/normalization/serialization,
  - UI component behavior and accessibility.
- **Integration (`tests/integration`)**:
  - `/api/respond` contract and model validation behaviors,
  - `/api/models` filtering/fallback/error/cache behaviors.
- **E2E (`tests/e2e`)**:
  - end-user flows for submit success/error/validation,
  - model selector loading/error/fallback note,
  - accessibility scans (axe).

## Minimum Merge Gates
- Typecheck passes.
- Lint passes.
- Unit + integration tests pass.
- E2E tests pass.
- a11y checks pass (unit and e2e suite commands).

---

# Acceptance Criteria

## Functional Parity
- [ ] Prompt validation and messages exactly match.
- [ ] Submit omits `model` when not selected.
- [ ] Server defaults omitted model to `gpt-4.1-mini`.
- [ ] `/api/respond` returns `{response, model}` on success.
- [ ] `/api/respond` returns stable error message/details contract on failures.
- [ ] `/api/models` enforces config + host validation before upstream call.
- [ ] `/api/models` filtering excludes only error/no-response lists.
- [ ] `/api/models` fallback behavior and metadata flags match.
- [ ] Model lists are alphabetically sorted.
- [ ] Cache behavior (fresh/stale refresh) matches observed semantics.

## Visual/UX Parity
- [ ] Page uses light slate gradient background, centered card layout.
- [ ] Header text and subtitle copy match.
- [ ] Form card, input, button, and response cards match shape/spacing/color hierarchy.
- [ ] Loading indicator and message text match.
- [ ] Error UI includes details toggle and retry where applicable.
- [ ] Fallback note copy exactly matches shared constant.
- [ ] Footer terms/privacy links and copy are present.

## Accessibility Parity
- [ ] Skip link and main landmark present.
- [ ] Alerts use `role="alert"`.
- [ ] Keyboard focus indicators visible on primary controls.
- [ ] Prompt and model fields expose required aria attributes.
- [ ] Details/retry controls are keyboard operable.

---

# Open Questions / Ambiguities

| ID | Ambiguity / Conflict | Impact | Proposed Default |
|---|---|---|---|
| OQ-001 | `server/utils/openai-model-support.ts` and related unit tests exist, but `/api/models` explicitly states no capability filtering and does not call this util. | Could lead to incorrect reintroduction of unsupported-model filtering. | Treat `openai-model-support` as non-runtime legacy utility; do not apply capability filtering in `/api/models` unless a new requirement explicitly enables it. |
| OQ-002 | `.env.example` includes only `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_ALLOWED_HOSTS`, while runtime also uses `OPENAI_ALLOW_INSECURE_HTTP`, `OPENAI_DISABLE_MODELS_CACHE`, and model-validation cache toggle env. | New implementers may miss optional but behavior-changing env controls. | Document all runtime env vars in setup docs; keep extra vars optional with safe defaults. |
| OQ-003 | README says “Node.js 20+” but `package.json` has no `engines` field. | Tooling/runtime drift risk. | Specify Node 20+ as baseline requirement in implementation and CI, and optionally add `engines` in future maintenance. |
| OQ-004 | `models.get.ts` expects OpenAI payload models and maps to strict `object:"model"` shape; some tests/e2e mocks omit `object` in model items. | Potential confusion about strictness in mocks vs runtime payload. | Enforce strict route output shape (`object:"model"`), but allow test mocks to stay minimal where not contract-critical. |
