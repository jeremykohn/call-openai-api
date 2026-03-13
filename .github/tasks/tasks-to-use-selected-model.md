# Tasks: Implement "Use Selected Model" Feature

## Feature overview
When a user submits a prompt, the selected model from the dropdown is sent to the server and used (or the hardcoded default `gpt-4.1-mini` if no model is selected). The implementation follows TDD with red-green-refactor cycles and validates selected model against the list from `/api/models`.

---

## Task list (ordered by dependency)

### Phase 1: Client Payload — Unit Tests & Implementation

#### Task 1.1: Write failing unit tests for client request payload
- **File:** `tests/unit/app.ui.test.ts`
- **What:** Add two new test cases in the existing test suite:
  - Test: "includes selected model in request when model is selected"
    - Setup: Mount app with `selectedModelId` set to a model ID
    - Action: Trigger form submission
    - Assert: Request body sent to `/api/respond` includes `{ prompt, model }`
  - Test: "omits model from request when no model is selected"
    - Setup: Mount app with `selectedModelId` = `null`
    - Action: Trigger form submission
    - Assert: Request body includes only `{ prompt }` (no `model` key)
- **Pass criteria:** Tests are written and fail (red phase).
- **Independently testable:** Run `npm run test:unit -- tests/unit/app.ui.test.ts`

---

#### Task 1.2: Implement client-side model inclusion in request payload
- **File:** `app/app.vue`
- **What:** Modify the `handleSubmit` function to conditionally include `model` in the request body:
  - If `selectedModelId.value` is truthy, add `model: selectedModelId.value` to the request body
  - Otherwise, send only `prompt`
- **Pass criteria:** Payload tests from Task 1.1 now pass (green phase).
- **Independently testable:** Run `npm run test:unit -- tests/unit/app.ui.test.ts`

---

#### Task 1.3: Refactor Phase 1 implementation
- **File:** `app/app.vue`
- **What:** Clean up the payload construction for readability and add proper TypeScript typing around the request body.
- **Pass criteria:** Tests still pass; code is cleaner.
- **Independently testable:** Run `npm run test:unit -- tests/unit/app.ui.test.ts`

---

#### Task 1.4: Format Phase 1 files with Prettier
- **Files:** `app/app.vue`, `tests/unit/app.ui.test.ts`
- **What:** Run Prettier to ensure consistent formatting.
  ```bash
  npx prettier --write app/app.vue tests/unit/app.ui.test.ts
  ```
- **Pass criteria:** Files are formatted; tests still pass.
- **Independently testable:** Run `npm run test:unit -- tests/unit/app.ui.test.ts`

---

### Phase 2: Type Contract — Updates & Validation

#### Task 2.1: Update TypeScript types for model support
- **File:** `types/chat.ts`
- **What:** Extend types to reflect model support:
  - Add optional `model?: string` field to `PromptRequest` type
  - Add `model: string` field to `ApiSuccessResponse` type
- **Pass criteria:** Type definitions match the new request/response contract.
- **Independently testable:** Run `npm run typecheck`

---

### Phase 3: Server Validation — Unit Tests & Implementation

#### Task 3.1: Write failing unit tests for server model validation
- **File:** `tests/unit/respond-route-model.test.ts` (new) or extend existing server test file
- **What:** Add three new test cases:
  - Test: "accepts valid model from request"
    - Mock: Request with a valid `model` ID (one that exists in `/api/models`)
    - Assert: Server does not reject; processes request
  - Test: "rejects invalid model with 400 status"
    - Mock: Request with unknown/invalid `model` ID
    - Assert: Server returns 400 status and error message indicating invalid model
  - Test: "uses default model when model is not provided"
    - Mock: Request without `model` field or with `model: null`
    - Assert: Server processes and uses default model internally
- **Pass criteria:** Tests are written and fail (red phase).
- **Independently testable:** Run `npm run test:unit -- tests/unit/respond-route-model.test.ts`

---

#### Task 3.2: Implement server model validation logic
- **File:** `server/api/respond.post.ts`
- **What:** Add model validation to the route handler:
  - Read `model` from request body if present
  - If `model` is provided:
    - Fetch available models via internal call to `/api/models`
    - Validate that `model` exists in the list
    - If invalid, return 400 with message "Model is not valid" or similar
  - If `model` is missing or empty, use the hardcoded default (`gpt-4.1-mini`)
  - Store the resolved model for later use in OpenAI request
- **Pass criteria:** Server validation tests from Task 3.1 now pass (green phase).
- **Independently testable:** Run `npm run test:unit -- tests/unit/respond-route-model.test.ts`

---

#### Task 3.3: Refactor server validation logic
- **File:** `server/api/respond.post.ts`
- **What:** Extract model validation and resolution into a helper function (e.g., `resolveModel()`) to improve readability and reusability.
- **Pass criteria:** Tests still pass; code is cleaner with reduced duplication.
- **Independently testable:** Run `npm run test:unit -- tests/unit/respond-route-model.test.ts`

---

#### Task 3.4: Format Phase 3 files with Prettier
- **Files:** `server/api/respond.post.ts`, `tests/unit/respond-route-model.test.ts`
- **What:** Run Prettier on modified files.
  ```bash
  npx prettier --write server/api/respond.post.ts tests/unit/respond-route-model.test.ts
  ```
- **Pass criteria:** Files are formatted; tests still pass.
- **Independently testable:** Run `npm run test:unit -- tests/unit/respond-route-model.test.ts`

---

#### Task 3.5: Verify type alignment after server implementation
- **File:** N/A (verification step)
- **What:** Run `npm run typecheck` to ensure no TypeScript errors in server implementation.
- **Pass criteria:** No type errors.
- **Independently testable:** Run `npm run typecheck`

---

### Phase 4: Server Response — Integration & Implementation

#### Task 4.1: Write failing integration tests for upstream OpenAI request and response
- **File:** `tests/integration/respond-route.test.ts`
- **What:** Add three new integration test cases:
  - Test: "includes selected model in upstream OpenAI request"
    - Setup: Mock OpenAI endpoint; send request to `/api/respond` with `{ prompt, model: "gpt-4" }`
    - Assert: The mocked fetch to OpenAI includes `"model": "gpt-4"` in the request body
  - Test: "includes default model in upstream OpenAI request when no model selected"
    - Setup: Mock OpenAI endpoint; send request to `/api/respond` with only `{ prompt }`
    - Assert: The mocked fetch to OpenAI includes `"model": "gpt-4.1-mini"` in the request body
  - Test: "includes model in successful response payload"
    - Setup: Mock successful OpenAI response; send request to `/api/respond`
    - Assert: Response body includes `"model": "..."` field with the model that was used
- **Pass criteria:** Tests are written and fail (red phase).
- **Independently testable:** Run `npm run test:integration -- tests/integration/respond-route.test.ts`

---

#### Task 4.2: Implement model propagation to OpenAI and response payload
- **File:** `server/api/respond.post.ts`
- **What:** Update the OpenAI API call to use the resolved model:
  - Pass the resolved `model` (from validation in Phase 3) to the OpenAI request body
  - Modify the success response to include `{ response: text, model: resolvedModel }`
- **Pass criteria:** Integration tests from Task 4.1 now pass (green phase).
- **Independently testable:** Run `npm run test:integration -- tests/integration/respond-route.test.ts`

---

#### Task 4.3: Refactor server response logic
- **File:** `server/api/respond.post.ts`
- **What:** Extract response construction into a helper function or improve inline clarity to avoid duplication between error and success paths.
- **Pass criteria:** Tests still pass; response construction is cleaner.
- **Independently testable:** Run `npm run test:integration -- tests/integration/respond-route.test.ts`

---

#### Task 4.4: Format Phase 4 files with Prettier
- **Files:** `server/api/respond.post.ts`, `tests/integration/respond-route.test.ts`
- **What:** Run Prettier on modified files.
  ```bash
  npx prettier --write server/api/respond.post.ts tests/integration/respond-route.test.ts
  ```
- **Pass criteria:** Files are formatted; tests still pass.
- **Independently testable:** Run `npm run test:integration -- tests/integration/respond-route.test.ts`

---

#### Task 4.5: Verify types after response implementation
- **File:** N/A (verification step)
- **What:** Run `npm run typecheck` to ensure types still align after response payload changes.
- **Pass criteria:** No type errors.
- **Independently testable:** Run `npm run typecheck`

---

### Phase 5: E2E & Accessibility — Full Flow Validation

#### Task 5.1: Write failing E2E tests for selected-model and default-model flows
- **File:** `tests/e2e/app.spec.ts`
- **What:** Add two new E2E test cases:
  - Test: "selecting a model and submitting generates response using that model"
    - Navigate to app
    - Select a specific model from the dropdown (e.g., "gpt-4")
    - Enter a prompt
    - Submit the form
    - Assert: Response is displayed in the UI (no error)
  - Test: "submitting without selecting a model generates response using default"
    - Navigate to app
    - Leave model dropdown unselected (or verify it shows "Select a model")
    - Enter a prompt
    - Submit the form
    - Assert: Response is displayed in the UI (no error); behavior indicates default was used
- **Pass criteria:** Tests are written and fail (red phase).
- **Independently testable:** Run `npm run test:e2e`

---

#### Task 5.2: Verify accessibility and help text alignment
- **File:** `tests/unit/models-selector.test.ts` or existing unit test suite
- **What:** Add or verify a test case:
  - Test: "displays correct help text for default model behavior"
    - Assert: Help text contains "Uses gpt-4.1-mini if no model is selected."
    - Assert: Help text is properly associated with the select via `aria-describedby`
    - Assert: No error class/attribute is shown when no model is selected
- **Pass criteria:** Accessibility expectations are documented and passing.
- **Independently testable:** Run `npm run test:unit -- tests/unit/models-selector.test.ts`

---

#### Task 5.3: Stabilize E2E tests and selectors
- **File:** `tests/e2e/app.spec.ts` (and `app/components/ModelsSelector.vue` only if required for E2E selectors)
- **What:** Adjust E2E selectors, waits, or timing to ensure tests pass reliably across multiple runs. Do not change feature behavior.
- **Pass criteria:** E2E tests pass reliably (run multiple times without flakes).
- **Independently testable:** Run `npm run test:e2e` multiple times

---

#### Task 5.4: Refactor E2E test setup/teardown
- **File:** `tests/e2e/app.spec.ts`
- **What:** Extract common E2E setup (navigation, mocking) into helper functions or shared fixtures to reduce duplication.
- **Pass criteria:** Tests still pass; setup code is cleaner.
- **Independently testable:** Run `npm run test:e2e`

---

#### Task 5.5: Format Phase 5 files with Prettier
- **Files:** `tests/e2e/app.spec.ts`, possibly `app/components/ModelsSelector.vue`
- **What:** Run Prettier on modified files.
  ```bash
  npx prettier --write tests/e2e/app.spec.ts
  ```
- **Pass criteria:** Files are formatted; E2E tests still pass.
- **Independently testable:** Run `npm run test:e2e`

---

### Phase 6: Final Verification & Cleanup

#### Task 6.1: Run full test suite and type check
- **File:** N/A (verification step)
- **What:** Execute all tests and typecheck to ensure no regressions:
  ```bash
  npm run test:unit
  npm run test:integration
  npm run test:e2e
  npm run typecheck
  ```
- **Pass criteria:** All tests pass, no type errors.
- **Independently testable:** Run full test suite

---

#### Task 6.2: Final formatting sweep
- **Files:** All modified files across the feature
- **What:** Run Prettier on all changed files as a final check:
  ```bash
  npx prettier --write app/app.vue app/components/ModelsSelector.vue server/api/respond.post.ts types/chat.ts tests/unit/app.ui.test.ts tests/unit/respond-route-model.test.ts tests/unit/models-selector.test.ts tests/integration/respond-route.test.ts tests/e2e/app.spec.ts
  ```
- **Pass criteria:** All files are consistently formatted.
- **Independently testable:** Run `npm run test` + `npm run typecheck` after formatting

---

## Execution checkpoints

- **Checkpoint 1 (end of Phase 1):** Client correctly includes/omits model in request payload.
- **Checkpoint 2 (end of Phase 3):** Server validates model and falls back to default.
- **Checkpoint 3 (end of Phase 4):** Server propagates model to OpenAI and returns it in response.
- **Checkpoint 4 (end of Phase 5):** E2E flow works; accessibility requirements met.
- **Checkpoint 5 (end of Phase 6):** All tests pass; codebase clean and formatted.

## Dependencies summary

- **Tasks 1.1–1.4** are independent (Phase 1, client-side).
- **Tasks 2.1** may be done early and updated as needed (types).
- **Tasks 3.1–3.5** depend on Tasks 1.2–1.3 (server reads model that client sends).
- **Tasks 4.1–4.5** depend on Tasks 3.1–3.3 (server must validate before propagating).
- **Tasks 5.1–5.5** depend on all prior phases (full integration test).
- **Tasks 6.1–6.2** depend on all prior phases (final verification).
