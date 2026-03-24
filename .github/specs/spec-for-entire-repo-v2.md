# Product Overview

## Purpose
`call-openai-api` is a Nuxt 4 web application that enables users to:
1. View an OpenAI model selector populated from OpenAI's models API
2. Enter a text prompt (max 4000 characters)
3. Submit the prompt and selected model to OpenAI's Responses API
4. View the generated response or error information

The application emphasizes secure server-side OpenAI integration, deterministic behavior, accessible UI/UX, and clear error communication.

## Core User Flow
1. User navigates to `/`
2. App auto-fetches available models from `GET /api/models` (displayed in a dropdown)
3. User optionally selects a model from the dropdown (or accepts the default `gpt-4.1-mini`)
4. User enters a prompt text (required, max 4000 characters after trimming)
5. User clicks "Send" button
6. App sends `POST /api/respond` with prompt and optionally selected model
7. App displays:
   - Loading indicator while waiting
   - Success card with response text on success
   - Error alert with optional details toggle on failure

---

# Functional Requirements

## Prompt Input and Validation

- **FR-001**: App MUST render a `<textarea>` element labeled `Prompt` on the main form.
- **FR-002**: Textarea MUST have `maxlength="4000"` attribute and `aria-required="true"`.
- **FR-003**: Client-side validation MUST trim whitespace and check:
  - Empty or whitespace-only input: show error `Please enter a prompt.` and focus textarea
  - Input exceeds 4000 characters after trim: show error `Prompt must be 4000 characters or fewer.`
- **FR-004**: Submit button text MUST be `Send`.
- **FR-005**: Submit button MUST be disabled (`:disabled`) while request is in flight (`state.status === 'loading'`).
- **FR-006**: Submit button MUST have `aria-busy="true"` while loading.
- **FR-007**: Prompt validation error MUST be announced via `role="alert"` element below the textarea.
- **FR-008**: Helper text `Maximum 4000 characters.` MUST display below textarea (with `id="prompt-help"`).
- **FR-009**: Validation errors MUST programmatically focus the textarea field using `.focus()`.

## Model Selection and Dropdown

- **FR-010**: App MUST fetch models from `GET /api/models` on client initialization (skip during SSR).
- **FR-011**: Model selector MUST render as `<select>` element with label `Model`.
- **FR-012**: When models are loading, show loading indicator with text `Loading models...` (not the select).
- **FR-013**: When models fail to load, show select disabled + `UiErrorAlert` with retry button labeled `Try again`.
- **FR-014**: When no models available, show select disabled with only placeholder `No models available`.
- **FR-015**: When models successfully load, show select with default placeholder `Select a model` and all models as options.
- **FR-016**: Model list MUST be sorted alphabetically by model ID.
- **FR-017**: Helper text `Uses gpt-4.1-mini by default if none is selected.` MUST display below select in non-loading states.
- **FR-018**: If response includes `showFallbackNote=true`, display fallback note:
  `Note: List of OpenAI models may include some older models that are no longer available.`
- **FR-019**: Select MUST expose `aria-required`, `aria-invalid` (when error), and `aria-describedby` attributes.
- **FR-020**: If model selection fails to fetch, show inline error with details toggle and retry button in error alert.

## Request Submission and Response Flow

- **FR-021**: Submit button click MUST validate prompt first (before sending request).
- **FR-022**: If prompt validation fails, do not send request; show error and focus textarea.
- **FR-023**: If prompt is valid, send `POST /api/respond` with JSON body: `{ prompt: <trimmed string>, model?: <selected id or omitted> }`.
- **FR-024**: If no model selected, request body MUST omit `model` key entirely.
- **FR-025**: Server MUST resolve omitted `model` to default `gpt-4.1-mini`.
- **FR-026**: While request is in flight, show loading spinner with text `Waiting for response from ChatGPT...`.
- **FR-027**: On successful response (200), display success card with:
  - Heading: `Response`
  - Response text: rendered with `white-space: pre-wrap` to preserve formatting
  - Background color: emerald with border
- **FR-028**: On request failure, show `UiErrorAlert` with:
  - Title: `Something went wrong`
  - Message: normalized error message (from error normalization util)
  - Optional details: hidden by default, toggled via `Show details` / `Hide details` button
  - No retry button for response errors (only for models fetch errors)

## Model Validation at Submit Time

- **FR-029**: Server MUST validate selected model against upstream `/models` list before calling `/responses`.
- **FR-030**: If selected model is not in the available models list, return `400` with message `Model is not valid`.
- **FR-031**: If selected model validation cannot be performed (e.g., upstream unavailable), return `502` with message `Unable to validate model right now. Please try again.`
- **FR-032**: Model validation MUST use cached models list (5-minute TTL) when available.

## Error Handling and UI States

- **FR-033**: Client-side errors MUST normalize to three categories:
  - `network`: Network fetch failures or timeouts
  - `api`: API error responses with error payload
  - `unknown`: All other unexpected failures
- **FR-034**: Network errors MUST show canonical message:
  `Network error: Unable to reach OpenAI. Please check your internet connection and try again.`
- **FR-035**: API errors MUST show:
  - Main message from server response (sanitized)
  - Optional technical details (from `details` field in error response)
  - Details toggled via `Show details` / `Hide details` button
- **FR-036**: Unknown errors MUST show canonical message:
  `An unexpected error occurred. Please try again or contact support.`
- **FR-037**: Error details MUST be collapsed (hidden) by default.
- **FR-038**: Error message MUST be announced via `role="alert"` component.

## Models API Behavior

- **FR-039**: `GET /api/models` MUST proxy OpenAI's `/models` endpoint and apply optional local filtering.
- **FR-040**: Filtering MUST exclude only model IDs listed in `models-with-error` and `models-with-no-response` categories from the local config file.
- **FR-041**: Models in `available-models` and `other-models` categories MUST NOT be excluded.
- **FR-042**: Final models list MUST be sorted alphabetically by `id` field.
- **FR-043**: Response MUST include metadata fields:
  - `usedConfigFilter: boolean` — true if local config filtering was applied
  - `showFallbackNote: boolean` — true if fallback mode (config missing/invalid)
- **FR-044**: If local config file is missing, unreadable, malformed, or invalid, route MUST:
  - Use full upstream models list (no filtering)
  - Set `usedConfigFilter = false`
  - Set `showFallbackNote = true`
- **FR-045**: If local config is valid, route MUST:
  - Apply filtering to exclude error/no-response models
  - Set `usedConfigFilter = true`
  - Set `showFallbackNote = false`
- **FR-046**: Models list response MUST be cached (24-hour TTL) and served from cache when available.
- **FR-047**: Stale cache (older than 24 hours) MUST trigger background refresh without blocking the response.

## Response API Behavior

- **FR-048**: `POST /api/respond` MUST accept request body: `{ prompt: string, model?: string }`.
- **FR-049**: Successful response (200) MUST return: `{ response: string, model: string }`.
- **FR-050**: On upstream OpenAI error, return same status code with:
  - `message: "Request to OpenAI failed."`
  - Optional sanitized `details` field (if available)
- **FR-051**: On internal server error, return 500 with same message/details contract.
- **FR-052**: All error details MUST be sanitized (redacting Bearer tokens, API keys, Authorization headers).

---

# Non-Functional Requirements

## Reliability and Determinism

- Model list sorting MUST be case-sensitive alphabetical using JavaScript `localeCompare()`.
- Cache keys for models list MUST be based on the OpenAI base URL.
- Request deduplication in `useModelsState` MUST prevent stale responses via request ID tracking.
- AbortController MUST be used to cancel in-flight requests when a new fetch is triggered.

## Performance

- Model validation cache TTL: **5 minutes** (in-memory per base URL key)
- Models response cache TTL: **24 hours** (in-memory per base URL key)
- Stale cache MUST trigger non-blocking background refresh

## Maintainability

- TypeScript strict mode enabled throughout (`typescript.strict: true` in nuxt.config.ts)
- All error handling separated into dedicated utility modules (`error-normalization.ts`, `error-sanitization.ts`, `type-guards.ts`)
- Security validation centralized in `openai-security.ts`
- Models config loading centralized in `openai-models-config-loader.ts`

## Compatibility

- Nuxt 4.x with Vue 3 Composition API and `<script setup>` syntax
- Tailwind CSS 3.4 (utility-first, no custom theme extensions)
- Target runtime: Node.js 20+
- Target deployment: Vercel (Nitro preset)

---

# System Architecture

## High-Level Layers

| Layer | Path | Responsibility |
|---|---|---|
| UI Components | `app/components/` | Presentational components (ModelsSelector, UiErrorAlert) |
| Composables | `app/composables/` | Client-side state management (useRequestState, useModelsState) |
| App Container | `app/app.vue` | Main page layout, form, response display, submission logic |
| Client Utils | `app/utils/` | Validation, error normalization, sanitization, logging |
| Server Routes | `server/api/` | HTTP endpoints (respond.post.ts, models.get.ts) |
| Server Utils | `server/utils/` | Security, caching, config loading, OpenAI response parsing |
| Shared Constants | `shared/constants/` | DEFAULT_MODEL, MODELS_FALLBACK_NOTE_TEXT |
| Type Definitions | `types/`, `server/types/` | Client/server contracts (PromptRequest, ApiSuccessResponse, etc.) |
| Configuration | `nuxt.config.ts`, `.env` | Runtime config mapping and environment variables |
| Tests | `tests/` | Unit, integration, e2e, accessibility |

## Request Lifecycle (Respond Endpoint)

1. **Client**: User submits form with prompt and optional model ID
2. **Client**: Local `validatePrompt()` trims and checks length
3. **Client**: Submission prevented if validation fails
4. **Network**: POST request sent to `/api/respond`
5. **Server**: Route validates prompt again server-side
6. **Server**: Route reads and validates OpenAI runtime config (API key, allowed hosts)
7. **Server**: Route resolves model:
   - If omitted: use `gpt-4.1-mini`
   - If provided: validate against cached/fresh models list
8. **Server**: Route builds OpenAI request to `/responses` endpoint
9. **Network**: Request sent to OpenAI API with Bearer auth
10. **Server**: Response body parsed; checks if status is OK
11. **Server**: On success: extract response text and return `{ response, model }`
12. **Server**: On error: build sanitized error details and return error contract
13. **Network**: Client receives response
14. **Client**: Response normalized via `normalizeUiError()`
15. **Client**: UI updated to show response or error

## Request Lifecycle (Models Endpoint)

1. **Client**: On app init (skip SSR), `useModelsState` calls `GET /api/models`
2. **Server**: Route validates OpenAI config
3. **Server**: Check if cached response exists and is fresh (< 24 hours)
4. **Server**: If cached and fresh, build and return response from cache
5. **Server**: If cached but stale, trigger background refresh and return stale cache
6. **Server**: If no cache, fetch from OpenAI `/models` endpoint
7. **Server**: Parse upstream response and cache it
8. **Server**: Load local config file (if available and valid)
9. **Server**: If config valid: filter out error/no-response models, set flags
10. **Server**: If config invalid: use full upstream list, set fallback flags
11. **Server**: Sort models alphabetically
12. **Server**: Return complete response with metadata
13. **Network**: Client receives models response
14. **Client**: Composable updates state with data and metadata flags
15. **Client**: Dropdown renders with models and optional fallback note

---

# API and Data Contracts

## POST /api/respond

### Request
```json
{
  "prompt": "string (required, trimmed, max 4000 chars)",
  "model": "string (optional, OpenAI model ID)"
}
```

### Success Response (HTTP 200)
```json
{
  "response": "string (the generated response from OpenAI)",
  "model": "string (the model used for the response)"
}
```

### Error Response (HTTP 400, 500, 502, or upstream status)
```json
{
  "message": "string (user-facing error message)",
  "details": "string (optional, technical details for debugging)"
}
```

### Status Codes and Rules
- **200**: Successful response from OpenAI
- **400**: Invalid prompt (empty, too long) OR invalid model ID
- **502**: Model validation temporarily unavailable (cannot validate against models list)
- **500**: Unhandled server error or OpenAI request failed with unexpected status
- **Passthrough**: If OpenAI returns non-2xx status, route returns same status with canonical message + sanitized details

---

## GET /api/models

### Success Response (HTTP 200)
```json
{
  "object": "list",
  "data": [
    {
      "id": "string (model identifier, e.g. 'gpt-4o')",
      "object": "model",
      "created": 1234567890,
      "owned_by": "string (e.g. 'openai')"
    }
  ],
  "usedConfigFilter": true,
  "showFallbackNote": false
}
```

### Error Response (HTTP 500)
```json
{
  "message": "string (canonical message: 'Error: Failed API call, could not get list of OpenAI models')",
  "details": "string (optional, sanitized error details)"
}
```

### Metadata Fields
- **usedConfigFilter**: true if local config filtering was applied, false if fallback mode
- **showFallbackNote**: true if config invalid (show user disclaimer about older models)

### Models Config Schema (server/assets/models/openai-models.json)
```json
{
  "available-models": ["array of model IDs"],
  "models-with-error": ["array of model IDs to exclude from dropdown"],
  "models-with-no-response": ["array of model IDs to exclude from dropdown"],
  "other-models": ["array of model IDs (informational, not used for filtering)"]
}
```

### Config Validation Rules
- File MUST be valid JSON at runtime or parsing will fail
- Root MUST be an object with all four keys
- Each key value MUST be an array of strings
- Missing, unreadable, malformed, or invalid config triggers fallback mode
- In fallback mode: full upstream list is returned, no filtering applied

### Filtering Rules
- Exclude set = union of `models-with-error` + `models-with-no-response`
- Models in exclude set are removed from final response data
- `available-models` and `other-models` are informational only (not used for exclusion)
- Final list MUST be sorted alphabetically by model ID

---

# UI/UX Specification

## Page Layout (app/app.vue)

### Header Section
- Skip link (visually hidden, appears on focus): `Skip to main` → `#maincontent`
- H1 heading: `ChatGPT prompt tester`
- Subheading: `Send a prompt and see the response.`
- Full-height gradient background: `from-slate-50 via-white to-slate-100`
- Centered, max-width layout

### Main Content (id="maincontent")
- Form with two controls:
  1. **ModelsSelector** component (see below)
  2. **Prompt textarea** with label and helper text
- Submit button labeled `Send` (blue, rounded full design)
- Response display section below form:
  - Loading state: spinner + text
  - Success state: card with response text
  - Error state: UiErrorAlert component

### Footer Section
- Legal text with links to OpenAI Terms and Privacy Policy
- Accessible link styling with focus indicators

## ModelsSelector Component (app/components/ModelsSelector.vue)

### States and Rendering

| State | Render | Behavior |
|---|---|---|
| **Loading** | Spinner + `Loading models...` text | No select visible; status announced via `role="status"` |
| **Success** (has models) | Select with placeholder + options | Dropdown fully functional |
| **Success** (no models) | Select disabled + `No models available` placeholder | Option list empty except placeholder |
| **Error** | Select disabled + UiErrorAlert below | Error message + retry button visible |

### Helper Text and Notes
- Always show (except during loading): `Uses gpt-4.1-mini by default if none is selected.`
- If `showFallbackNote=true`: show fallback note `Note: List of OpenAI models may include some older models that are no longer available.`

### Accessibility
- Label: `Model` with required indicator `*`
- Select has:
  - `aria-required="true"` (or based on required prop)
  - `aria-invalid="true"` when error
  - `aria-describedby="models-select-help models-select-error"` (dynamic)
- Loading indicator: `role="status"` + `aria-live="polite"`
- Error container: nested UiErrorAlert with `role="alert"`

## UiErrorAlert Component (app/components/UiErrorAlert.vue)

### Props
- **message** (required): Error message text
- **title** (optional): Error title (e.g., `Something went wrong`)
- **details** (optional): Technical details (hidden by default if toggle enabled)
- **enableDetailsToggle**: If true and details provided, show `Show details` / `Hide details` button
- **showRetry**: If true, show `Try again` button (for models retry only)
- **detailsToggleTestId**, **retryButtonTestId**: Test identifiers

### Rendering
- `role="alert"` container
- Title (if provided): bold, smaller text
- Message: always visible
- Details toggle button (if enabled and details exist):
  - Text: `Show details` or `Hide details`
  - `aria-expanded`: reflects visibility state
  - Styled as underline button
- Details text (if visible): `<span>Details:</span> {details}`
- Retry button (if showRetry):
  - Text: retryLabel (default `Try again`)
  - Styled as underline button
  - Emits `@retry` event on click

## Full-Page States

### Idle State (initial)
- Form visible with all controls
- Models loading indicator shown
- No response visible

### Loading Response
- Form visible but submit button disabled
- Models dropdown disabled (if already loaded)
- Loading spinner + `Waiting for response from ChatGPT...` text shown
- No response text visible

### Success Response
- Form and controls fully functional
- Success card displayed with heading `Response` and pre-wrap response text
- Emerald-colored card with border

### Error Response
- Form and controls fully functional
- UiErrorAlert displayed with title, message, optional details toggle, no retry button

---

# Styling and Design System

## Framework and Setup
- **Tailwind CSS 3.4** via `@nuxtjs/tailwindcss` module
- **CSS Directives**: `@tailwind base`, `@tailwind components`, `@tailwind utilities` in `app/assets/main.css`
- **No custom theme extensions**: uses default Tailwind palette only
- **Content paths**: scans `app/**/*.{vue,js,ts}`, `components/**/*.{vue,js,ts}`, `layouts/**/*.{vue,js,ts}`, `pages/**/*.{vue,js,ts}`, `server/**/*.{ts,js}`

## Color Palette

| Use Case | Classes | Colors |
|---|---|---|
| Background | `bg-gradient-to-b from-slate-50 via-white to-slate-100` | Light slate gradient |
| Text (primary) | `text-slate-900` | Dark slate |
| Text (secondary) | `text-slate-600` | Medium slate |
| Text (muted) | `text-slate-500` | Light slate |
| Borders | `border-slate-200`, `border-slate-300` | Very light slate |
| Form inputs | `bg-white border-slate-200` | White with light border |
| Primary action | `bg-blue-600 hover:bg-blue-700` | Blue |
| Focus ring | `focus-visible:outline-blue-500` | Blue |
| Success card | `bg-emerald-50 border-emerald-200 text-emerald-900` | Emerald tones |
| Error card | `bg-red-50 border-red-200 text-red-700/red-800` | Red tones |
| Disabled state | `bg-slate-100 text-slate-500` | Slate with reduced contrast |

## Typography and Spacing

| Element | Classes | Notes |
|---|---|---|
| H1 heading | `text-3xl sm:text-4xl font-semibold tracking-tight` | Responsive scaling |
| Subheading | `text-base sm:text-lg text-slate-600` | Responsive scaling |
| Button text | `text-sm font-semibold` | Consistent small size |
| Form label | `text-sm font-semibold text-slate-700` | Consistent form styling |
| Helper text | `text-xs text-slate-500` | Extra small, muted |
| Error message | `text-sm text-red-700` | Small, red text |

## Layout and Spacing

| Element | Classes | Notes |
|---|---|---|
| Page container | `min-h-screen px-6` | Full height with padding |
| Header | `pb-8 pt-12 text-center` | Vertical spacing |
| Main content | `mx-auto w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-14` | Max width 3xl, flex column |
| Form | `grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur` | Card style with glass effect |
| Form fields | `gap-4` | Vertical spacing between fields |
| Textarea | `min-h-32 w-full resize-y rounded-xl border border-slate-200 px-4 py-3` | Resizable with min height |
| Button | `inline-flex items-center justify-center rounded-full px-5 py-2.5` | Rounded full, padded |
| Response card | `grid gap-3 rounded-2xl border p-6 shadow-sm` | Card style |
| Response text | `whitespace-pre-wrap text-sm` | Preserve formatting |

## Focus and Interaction States

| Element | Focus Styling | Hover/Active |
|---|---|---|
| Input fields | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500` | Color-specific outline |
| Buttons | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500` | Blue outline |
| Links | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500` | Blue outline |
| Disabled inputs | `disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500` | Muted appearance |
| Button hover | `hover:-translate-y-0.5 hover:bg-blue-700` | Subtle lift + color change |

## Responsive Design

- **Breakpoints used**: `sm` (640px minimum)
- **Header**: `text-3xl` base → `sm:text-4xl` on larger screens
- **Subheading**: `text-base` base → `sm:text-lg` on larger screens
- **Layout**: `max-w-3xl` enforced on all screen sizes for readability
- **Padding**: Consistent `px-6` applied; adjusted via max-width constraint rather than per-breakpoint padding changes

## Visual Hierarchy and Constraints

- Main content always constrained to `max-w-3xl` centered
- Header title is largest and bold
- Form inputs and buttons clearly distinguished from text
- Success/error states use distinct color families for quick recognition
- Focus states highly visible with 2px outline offset

---

# State Management and Client Logic

## useRequestState Composable (app/composables/use-request-state.ts)

### State Shape
```typescript
type RequestState = {
  status: "idle" | "loading" | "success" | "error",
  data: string | null,
  error: string | null,
  errorDetails: string | null
}
```

### Methods
- **start()**: Sets status to `loading`, clears data/error/errorDetails
- **succeed(data: string)**: Sets status to `success`, stores response text in data
- **fail(error: string, details?: string)**: Sets status to `error`, stores error message and optional details
- **reset()**: Reverts to initial idle state

### Usage in app.vue
1. Call `start()` when form is submitted
2. On success response, call `succeed(response.response)`
3. On error, call `fail(normalizedError.message, normalizedError.details)`
4. State drives conditional rendering of loading/success/error UI sections

## useModelsState Composable (app/composables/use-models-state.ts)

### State Shape
```typescript
type ModelsState = {
  status: "idle" | "loading" | "success" | "error",
  data: ReadonlyArray<OpenAIModel> | null,
  usedConfigFilter: boolean,
  showFallbackNote: boolean,
  error: string | null,
  errorDetails: string | null
}
```

### Initialization
- If SSR: status = `idle`
- If client: status = `loading` and immediately call `fetchModels()`

### Methods
- **fetchModels()**: Fetches from `/api/models`, updates state, handles errors with normalization

### Request Deduplication
- Request ID tracking via `latestRequestId` counter
- AbortController for canceling in-flight requests
- When new fetch triggered, old controller aborted and request ID incremented
- Stale responses ignored by comparing request ID before state update

### Error Handling
- Errors normalized via `normalizeUiError()` utility
- Logged via `logNormalizedUiError()` with source tag
- Error message and optional details stored in state

## App Submit Logic (app/app.vue)

### Form Submission Handler (handleSubmit)
1. Prevent re-submit if already loading
2. Clear previous validation error
3. Validate prompt:
   - If invalid, show error and focus textarea, do not submit
   - If valid, proceed
4. Call `start()` to set state to loading
5. Build request body:
   - Always include: `{ prompt: <trimmed> }`
   - Conditionally include: `model: <selected ID>` if selectedModelId is set
6. Fetch `/api/respond` with body
7. On success:
   - Normalize response via `normalizeUiError()`
   - Call `succeed(response.response)`
8. On error:
   - Normalize error via `normalizeUiError()`
   - Log error via `logNormalizedUiError()`
   - Call `fail(normalizedError.message, normalizedError.details)`

### Reactive Data
- **prompt** (ref): textarea v-model binding
- **selectedModelId** (ref): select v-model binding (null if not selected)
- **validationError** (ref): inline error message
- **state** (from composable): response state (idle/loading/success/error)
- **modelsState** (from composable): models list state

## Data Flow Summary
1. Models fetch on init → `modelsState` → renders dropdown
2. User submits prompt → validation → request sent
3. Server processes and responds → normalized → `state` updated
4. State drives UI rendering (loading/success/error sections)

---

# Error Handling and Empty States

## Error Normalization (app/utils/error-normalization.ts)

### Categories and Messages

| Category | Condition | User Message | Details |
|---|---|---|---|
| **network** | Network fetch failure (no response) | `Network error: Unable to reach OpenAI. Please check your internet connection and try again.` | No details included |
| **api** | API error response (has error payload) | Message from API response (sanitized) | Technical details from API (if provided, sanitized) |
| **unknown** | Any other error | `An unexpected error occurred. Please try again or contact support.` | Error message text (if available, sanitized) |

### Implementation
- Uses `type-guards.ts` to detect error type
- `isNetworkFetchError()`: checks for network-specific error signals
- `isApiError()`: checks for error response with error/message fields
- Falls back to `unknown` for unrecognized errors

## Error Sanitization (app/utils/error-sanitization.ts)

### Patterns Redacted
- **API Keys**: `sk-[A-Za-z0-9_-]{8,}` → `[REDACTED]`
- **Bearer Tokens**: `Bearer <base64-like>` → `Bearer [REDACTED]`
- **Authorization Headers**: `Authorization: <value>` → `Authorization: [REDACTED]`

### Sanitization Functions
- **sanitizeErrorText(value: string)**: Applies all redaction patterns, returns sanitized string
- **sanitizeOptionalErrorText(value?: string)**: Returns undefined if input empty, else sanitizes

### Server-Side Usage
- Response parsing: all error details sanitized before returning to client
- Exception handling: error messages sanitized before including in response body

## Empty States and Fallback Behavior

### No Models Available
- Select element rendered but disabled
- Placeholder text: `No models available`
- No options in dropdown
- Helper text still shown: `Uses gpt-4.1-mini by default if none is selected.`
- User can still submit (server resolves to default model)

### Models Fetch Error
- Select shown but disabled
- UiErrorAlert below select with:
  - Error message (network/api/unknown)
  - Optional details toggle
  - Retry button labeled `Try again`
- User can retry without reloading page

### Invalid Prompt
- Inline error alert below textarea with `role="alert"`
- Error text: specific message (empty or too long)
- Textarea receives focus
- Submit prevented until corrected

### Missing/Invalid Config
- `GET /api/models` succeeds with fallback flags:
  - `usedConfigFilter = false`
  - `showFallbackNote = true`
- Full upstream models list returned (no filtering)
- UI displays fallback note to user

---

# Security Requirements

## Secrets and Boundaries

- **OPENAI_API_KEY**: Server-side only, read from runtime config `openaiApiKey`
  - MUST NOT be exposed in client code or logs
  - MUST NOT be sent to client
  - Used only server-side for OpenAI authentication
- **Client never calls OpenAI directly**: All requests proxied through server routes
- Server routes MUST add Authorization header with Bearer token

## Allowed Host Enforcement

- **OPENAI_BASE_URL**: Must pass allowlist check against `OPENAI_ALLOWED_HOSTS`
- **Allowlist parsing**: `parseAllowedHosts()` splits comma-separated entries, normalizes via URL API
- **Invalid entries**: `parseInvalidAllowedHosts()` returns rejected entries
- **Validation rules**:
  - URL protocol must match (http allowed only if `OPENAI_ALLOW_INSECURE_HTTP=true`)
  - URL with embedded credentials (user:pass) rejected
  - All entries in allowlist must be valid
  - Empty allowlist rejects all requests
- **Enforcement**: Both `/api/respond` and `/api/models` validate before upstream calls

## Config Validation

- **API Key check**: Missing or empty → 500 error
- **Allowlist check**: Empty or contains invalid entries → 500 error
- **Invalid hosts check**: Any unparseable entries → 500 error
- **Error message**: Generic `Internal Server Error` response (no detail leakage)

## Error Detail Hygiene

- All upstream error details sanitized before client response
- Redaction patterns applied:
  - API key patterns
  - Bearer tokens
  - Authorization headers
- Details only included in response if present after sanitization (no empty details field)

## Input Validation

- **Prompt**: Server-side validation matches client-side (trim, length check)
- **Model ID**: Validated against cached/fresh models list
- **Config parsing**: Strict validation of JSON schema and types

---

# Accessibility Requirements

## Keyboard Navigation

- **Tab order**: All interactive elements (inputs, buttons, links) are keyboard reachable
- **Skip link**: First focusable element, visually hidden until focused, links to `#maincontent`
- **Focus indicators**: All interactive elements have visible focus rings (`focus-visible:outline`)
- **Form submission**: Can be triggered via Enter key on form
- **Error focus**: When validation fails, focus programmatically set to textarea via `.focus()`
- **Details toggle**: Can be toggled via Space/Enter while focused
- **Retry button**: Clickable via keyboard

## Semantic Markup and ARIA

| Element | Semantics | ARIA Attributes |
|---|---|---|
| Textarea | `<textarea>` native | `aria-required="true"`, `aria-invalid="true/false"`, `aria-describedby="prompt-help prompt-error"` |
| Select | `<select>` native | `aria-required="true"`, `aria-invalid="true/false"`, `aria-describedby="models-select-help models-select-error"` |
| Form error | `<p>` with `role="alert"` | `id="prompt-error"` for aria-describedby |
| Models error | `UiErrorAlert` | `role="alert"` |
| Loading indicator | Spinner + text | `role="status"` + `aria-live="polite"` |
| Details toggle | `<button>` | `aria-expanded="true/false"` |
| Response section | `<section>` | `aria-live="polite"` + `aria-atomic="true"` |
| Error heading | `<p>` or title | Title content (title prop in UiErrorAlert) |
| Main content | `<main id="maincontent">` | Landmark for skip link |

## Color Contrast

- **Text on light backgrounds**: Dark slate text (text-slate-900) on light backgrounds meet WCAG AAA
- **Error text**: Red-700/800 on red-50 background meets WCAG AA
- **Success text**: Emerald-900 on emerald-50 background meets WCAG AA
- **Form labels**: Dark slate-700 on white/light backgrounds meet WCAG AAA
- **Disabled state**: Reduced contrast acceptable as disabled controls not interactive

## Error Communication

- **Error alerts**: Use `role="alert"` for immediate announcement
- **Inline errors**: Placed adjacent to field with aria-describedby reference
- **Details toggle**: Hidden details labeled `Show details` / `Hide details`
- **Error messages**: Clear, specific, actionable text
  - Example: `Prompt must be 4000 characters or fewer.`
  - Example: `Network error: Unable to reach OpenAI. Please check your internet connection and try again.`

## Form Accessibility

- All inputs have associated labels (`<label for="...">`)
- Required indicator (`*`) shown both visually and via aria-required
- Helper text linked via aria-describedby
- Error messages announced and linked to field

## Testing

- Unit test file: `tests/unit/app.a11y.test.ts` checks app component accessibility
- E2E test file: `tests/e2e/accessibility.spec.ts` runs axe accessibility checks
- Tests target WCAG A and AA tags via axe-core

---

# Configuration and Environment

## Runtime Config (nuxt.config.ts)

| Config Key | Environment Variable | Default | Type | Usage |
|---|---|---|---|---|
| `openaiApiKey` | `OPENAI_API_KEY` | `""` | string | Server-side; used for Bearer authentication |
| `openaiBaseUrl` | `OPENAI_BASE_URL` | `https://api.openai.com/v1` | string | Server-side; base URL for OpenAI API calls |
| `openaiAllowedHosts` | `OPENAI_ALLOWED_HOSTS` | `api.openai.com` | string | Server-side; comma-separated allowlist for URL validation |
| `openaiAllowInsecureHttp` | `OPENAI_ALLOW_INSECURE_HTTP` | `"false"` | string (boolean-like) | Server-side; if truthy, allows HTTP in addition to HTTPS |
| `openaiDisableModelsCache` | `OPENAI_DISABLE_MODELS_CACHE` | `"false"` | string (boolean-like) | Server-side; if truthy, disables models response caching |

## Additional Environment Variables

| Variable | Used By | Default | Type | Purpose |
|---|---|---|---|---|
| `OPENAI_DISABLE_MODEL_VALIDATION_CACHE` | `openai-model-validation.ts` | Not set | string (boolean-like) | If truthy, disables 5-minute validation cache |

## Boolean Parsing

- Environment variables are strings; boolean conversion uses `parseBooleanConfig()`
- Truthy values: `"1"`, `"true"`, `"yes"` (case-insensitive)
- Falsy values: `"0"`, `"false"`, `"no"`, `""`, undefined (case-insensitive)

## .env.example Template

```dotenv
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_ALLOWED_HOSTS=api.openai.com
```

## Config File (server/assets/models/openai-models.json)

### Optional Local Config
- Location: `server/assets/models/openai-models.json`
- Purpose: Optional local filtering of models dropdown
- Schema: 4-key object with model ID arrays
- If missing/invalid: fallback mode (no filtering, show disclaimer note)

### Expected File Format
```json
{
  "available-models": ["gpt-4o", "gpt-4o-mini"],
  "models-with-error": ["gpt-3.5-turbo-16k"],
  "models-with-no-response": ["davinci"],
  "other-models": []
}
```

### Fallback Behavior
- File missing: full upstream models used, `showFallbackNote=true`
- File unreadable: full upstream models used, `showFallbackNote=true`
- File invalid JSON: full upstream models used, `showFallbackNote=true`
- Schema missing keys or wrong types: full upstream models used, `showFallbackNote=true`

---

# Setup, Run, and Usage

## Prerequisites

- **Node.js**: Version 20 or higher (as noted in README)
- **npm**: Included with Node.js (for package management)
- **OpenAI API Key**: Required for API calls

## Installation

```bash
npm install
```

This installs all dependencies listed in package.json, including:
- Nuxt 4, Vue 3
- Tailwind CSS
- Testing frameworks (Vitest, Playwright, axe-core)
- Linting tools (ESLint, Prettier)

## Environment Setup

### 1. Copy env template
```bash
cp .env.example .env
```

### 2. Configure .env with required values
```bash
OPENAI_API_KEY=sk_your_actual_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ALLOWED_HOSTS=api.openai.com
```

### 3. Optional: Configure advanced settings
```bash
# Allow HTTP connections (useful for local development with mocks)
OPENAI_ALLOW_INSECURE_HTTP=false

# Disable models cache (cache on by default, 24-hour TTL)
OPENAI_DISABLE_MODELS_CACHE=false

# Disable model validation cache (cache on by default, 5-minute TTL)
OPENAI_DISABLE_MODEL_VALIDATION_CACHE=false
```

## Development Server

```bash
npm run dev
```

Starts Nuxt dev server on `http://127.0.0.1:3000` with hot module reloading.

## Production Build

```bash
npm run build
```

Compiles the app to `.output/` directory (Nitro preset: Vercel).

### Preview Built App

```bash
npm run preview
```

Runs the production build locally for testing.

## Testing

### Unit Tests
```bash
npm run test:unit
```

Runs Vitest with happy-dom environment. Covers:
- Composables
- Utility functions
- Components (Vue Test Utils)
- Accessibility checks (vitest-axe in app.a11y.test.ts)

### Integration Tests
```bash
npm run test:integration
```

Runs Vitest with Node environment. Tests server routes with mocked OpenAI server.

### E2E Tests
```bash
npm run test:e2e
```

Runs Playwright. Tests full user flows in a real browser.

### Accessibility Tests (Unit + E2E)
```bash
npm run test:a11y:unit
npm run test:a11y:e2e
npm run test:a11y
```

Runs accessibility checks via axe-core.

## Quality Gates

### Type Checking
```bash
npm run typecheck
```

Runs TypeScript compiler without emitting (strict mode).

### Linting
```bash
npm run lint
```

Runs:
- Typecheck
- ESLint (code quality)
- Prettier (formatting check)

### Auto-fix Linting Issues
```bash
npm run lint:fix
```

Runs ESLint and Prettier with `--fix` to auto-correct issues.

## Deployment

### To Vercel

1. Push code to GitHub repository
2. Vercel auto-detects Nuxt project
3. Configure environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL` (optional)
   - `OPENAI_ALLOWED_HOSTS` (optional)
4. Deploy automatically on push or manually

### Environment Variables in Vercel

All runtime config variables can be set in Vercel project settings:
- `OPENAI_API_KEY` (required)
- `OPENAI_BASE_URL` (default: https://api.openai.com/v1)
- `OPENAI_ALLOWED_HOSTS` (default: api.openai.com)
- `OPENAI_ALLOW_INSECURE_HTTP` (optional, default: false)
- `OPENAI_DISABLE_MODELS_CACHE` (optional, default: false)
- `OPENAI_DISABLE_MODEL_VALIDATION_CACHE` (optional, default: false)

---

# Testing and Quality Gates

## Test Structure

### Unit Tests (tests/unit/)
Vitest with happy-dom (browser-like) environment. Covers:
- **app.a11y.test.ts**: Accessibility checks on app component
- **app.ui.test.ts**: UI rendering and state transitions
- **error-normalization.test.ts**: Error categorization and messaging
- **error-sanitization.test.ts**: (if exists) Redaction patterns
- **prompt-validation.test.ts**: Validation logic (empty, length checks)
- **openai-security.test.ts**: Config parsing and validation
- **type-guards.test.ts**: Error type detection
- **openai-models-config.test.ts**: Config schema validation and filtering
- **models-list.test.ts**: Sorting and filtering logic
- **models-response-cache.test.ts**: Caching behavior
- **ui-error-alert.test.ts**: Error alert component rendering
- Component tests: ModelsSelector, etc.

### Integration Tests (tests/integration/)
Vitest with Node environment. Tests server routes with mocked OpenAI API:
- **respond-route.test.ts**: POST /api/respond with various inputs
  - Valid prompt and model
  - Invalid prompt (empty, too long)
  - Invalid model
  - Upstream errors
  - Model validation failure
- **models.test.ts**: GET /api/models with config variations
  - Config valid mode (filtering applied)
  - Fallback mode (config missing/invalid)
  - Caching behavior
  - Upstream errors
- **models-config-cache.test.ts**: Model validation cache behavior

### E2E Tests (tests/e2e/)
Playwright browser automation:
- **app.spec.ts**: Full user flow
  - Page loads
  - Models dropdown populates
  - Form submission succeeds
  - Error handling
- **models-selector.spec.ts**: Model selector behavior
  - Loading state
  - Options populated
  - Error state with retry
  - Fallback note display
- **accessibility.spec.ts**: Axe accessibility scanning
  - No violations on success page
  - No violations on error page
  - Keyboard navigation

## Minimum Merge Gates

All of the following MUST pass:

1. **npm run typecheck**: TypeScript compilation succeeds
2. **npm run lint**: ESLint and Prettier pass
3. **npm run test:unit**: All unit tests pass
4. **npm run test:integration**: All integration tests pass
5. **npm run test:e2e**: All e2e tests pass
6. **npm run test:a11y**: All accessibility tests pass

## Test Execution

```bash
npm test
```

Runs `npm run test:unit && npm run test:integration` (does not run e2e).

To run all tests including e2e:
```bash
npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:a11y
```

---

# Acceptance Criteria

## Functional Parity Checklist

- [ ] User can enter prompt (max 4000 chars) with `maxlength` attribute
- [ ] Prompt must not be empty/whitespace-only; error shown and focused on invalid input
- [ ] User can select model from dropdown (or leave unselected for default)
- [ ] Submit button disabled while request in flight
- [ ] Prompt submission sends POST `/api/respond` with `{ prompt, model? }`
- [ ] Omitted model resolved to server-side default `gpt-4.1-mini`
- [ ] Successful response (200) displays response text in success card
- [ ] Server validates selected model against models list; returns 400 if invalid
- [ ] Server returns 502 if model validation cache unavailable
- [ ] Error responses normalized to network/api/unknown categories
- [ ] Network errors show canonical network message
- [ ] API errors show API message with optional details toggle
- [ ] Unknown errors show canonical unknown message
- [ ] Error details hidden by default, toggled via `Show details` / `Hide details`
- [ ] Models dropdown fetches from `GET /api/models` on app init
- [ ] Models list sorted alphabetically
- [ ] Invalid/missing config triggers fallback mode (full upstream list)
- [ ] Valid config filters out error/no-response models
- [ ] Fallback note shown only when `showFallbackNote=true`
- [ ] Models fetch errors show error alert with retry button
- [ ] Models list cached (24-hour TTL) with stale-while-revalidate refresh
- [ ] Model validation cached (5-minute TTL)
- [ ] All error details sanitized (API keys, Bearer tokens, headers redacted)

## Visual/UX Parity Checklist

- [ ] Page background: light slate gradient (`from-slate-50 via-white to-slate-100`)
- [ ] Header centered with title `ChatGPT prompt tester` and subtitle `Send a prompt and see the response.`
- [ ] Main content max-width 3xl, centered
- [ ] Form card: white/glass background with border, rounded corners, shadow
- [ ] Textarea labeled `Prompt` with helper text `Maximum 4000 characters.`
- [ ] Model dropdown labeled `Model` with helper text about default
- [ ] Submit button: blue, rounded full, text `Send`, disabled while loading
- [ ] Loading state: spinner + `Waiting for response from ChatGPT...`
- [ ] Success response: emerald card with heading `Response` and pre-wrap text
- [ ] Error alert: red card with title `Something went wrong`, message, optional details
- [ ] Fallback note text exactly: `Note: List of OpenAI models may include some older models that are no longer available.`
- [ ] Footer with OpenAI Terms and Privacy Policy links
- [ ] All focus indicators visible (blue outline with offset)
- [ ] Disabled controls muted (gray text, gray background)

## Accessibility Parity Checklist

- [ ] Skip link present and functional (`Skip to main` → `#maincontent`)
- [ ] Main landmark `<main id="maincontent">` present
- [ ] Form fields have labels
- [ ] Prompt field: `aria-required="true"`, `aria-invalid` dynamic, `aria-describedby` linked
- [ ] Model select: `aria-required="true"`, `aria-invalid` dynamic, `aria-describedby` linked
- [ ] Error alerts: `role="alert"` present
- [ ] Loading indicator: `role="status"` + `aria-live="polite"`
- [ ] Details toggle: `aria-expanded` reflects state
- [ ] Required indicator: visual `*` shown
- [ ] Keyboard navigation: all controls reachable via Tab
- [ ] Focus indicators: clearly visible on all interactive elements
- [ ] Error validation: focus programmatically moved to textarea on failure
- [ ] Axe scans: no violations in unit and e2e accessibility tests
- [ ] Error messages: clear, specific, actionable

---

# Open Questions / Ambiguities

| ID | Finding | Impact | Proposed Resolution |
|---|---|---|---|
| **OQ-001** | `server/utils/openai-model-support.ts` exists with unit tests, but `/api/models` route explicitly states "Intentionally returns all upstream OpenAI models without capability filtering" and does not call this utility. | Could lead to incorrect reintroduction of capability-based filtering in `/api/models`. | Treat `openai-model-support.ts` as a non-runtime legacy utility. Do not apply any model capability/feature filtering in `/api/models` unless a future requirement explicitly enables it. Current behavior (return all upstream models + optional exclusion-based config filtering only) is correct. |
| **OQ-002** | `.env.example` documents only 3 variables (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_ALLOWED_HOSTS`), but nuxt.config.ts defines 5 runtime config keys, including `openaiAllowInsecureHttp` and `openaiDisableModelsCache`. | New implementers may miss optional but behavior-altering environment variables. | Document all 5 runtime config variables in `.env.example` with comments explaining their purpose and defaults. Keep them optional with safe defaults already in code. |
| **OQ-003** | README states "Node.js 20+" as prerequisite, but `package.json` has no `engines` field to enforce this at install time. | Potential tooling/runtime version mismatch if developer uses older Node. | Add `"engines": { "node": ">=20.0.0" }` to package.json for clarity. Ensure CI/CD enforces this version. |
| **OQ-004** | Route `/api/models` enforces strict output shape (`object: "model"` for each model), but some test mocks and payloads may omit this field. | Confusion about whether output contract is strict vs. lenient. | Keep strict route output (always set `object: "model"`). Allow test mocks to be minimal (omit `object` if not contract-critical for the test). Document this in test comments. |
| **OQ-005** | `useModelsState` uses AbortController to cancel in-flight requests when new fetch triggered, but SSR context may have different abort semantics. | Potential edge case during SSR hydration. | Current implementation already handles SSR: composable skips auto-fetch during SSR (checks `typeof window === "undefined"`). No abort issues during SSR. Design is sound. |

---

## Final Validation Summary

This specification covers:
✅ All implemented features end-to-end (models, prompt, response, errors)
✅ Complete API contracts (request/response shapes, status codes)
✅ Full UI/UX specification (layout, states, styling, accessibility)
✅ State management and data flow
✅ Error handling and normalization
✅ Security (secrets, validation, sanitization)
✅ Configuration and environment
✅ Setup, run, and test instructions (executable)
✅ Acceptance criteria (functional, visual, accessibility)
✅ Explicit ambiguities with proposed resolutions

An engineer can rebuild this application from this specification alone and achieve functional, visual, and behavioral parity.
