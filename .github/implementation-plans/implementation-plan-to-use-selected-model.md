# Implementation Plan: Use Selected Model on Prompt Submission

## Overview
This plan describes a Test-Driven Development (TDD) approach to implement the feature of passing the user's selected model from the dropdown to the server, and using that model (or a default) when calling the OpenAI Responses API.

## Current State
- The app already has a model dropdown (`ModelsSelector`) that displays available models fetched from `/api/models`.
- The selected model is tracked in `selectedModelId` in `app/app.vue`, but is **not** sent to the server.
- The server always uses a hardcoded default model (`gpt-4.1-mini`) when calling the OpenAI API.
- Help text in the UI currently says "Uses the default model if none is selected."

## Target State
- The client sends `model` in the request body to `/api/respond` when a model is selected; omits `model` if no selection.
- The server validates `model` if provided, rejects invalid values with a 400, or uses the hardcoded default if missing.
- The server passes the selected or default model to the OpenAI Responses API.
- Response payload includes which model was used.
- All tests (unit, integration, E2E) pass with green status.

## Implementation Approach (TDD Red-Green-Refactor)

### Phase 1: Unit Tests for Client Payload

**Goal:** Verify the client builds the correct request payload.

1. **Write unit test** (`tests/unit/app.ui.test.ts`):
   - Test: "emits request with selected model when model is selected"
     - Arrange: Mount app with a model selected
     - Act: Call `handleSubmit`
     - Assert: Request body includes `{ prompt, model }`
   
   - Test: "emits request without model when no model is selected"
     - Arrange: Mount app with no model selected
     - Act: Call `handleSubmit`
     - Assert: Request body includes only `{ prompt }` (no `model` key)

2. **Red phase:** Tests fail (client not sending `model`).

3. **Green phase:** Modify `app/app.vue` `handleSubmit` to include `selectedModelId.value` in the request:
   ```
   const body: any = { prompt: validation.prompt };
   if (selectedModelId.value) {
     body.model = selectedModelId.value;
   }
   ```

4. **Refactor:** Ensure code is clean and typed.

5. **Format:** Run Prettier on files added or modified in this phase (for example, `app/app.vue` and `tests/unit/app.ui.test.ts`).

---

### Phase 2: Unit Tests for Server Validation

**Goal:** Verify the server validates the model correctly.

1. **Write unit tests** (new file `tests/unit/respond-route-model.test.ts` or add to existing test):
   - Test: "accepts valid model from request"
     - Mock fetch with valid model in body
     - Assert: Server processes without error
   
   - Test: "rejects invalid model with 400"
     - Mock fetch with unknown model ID
     - Assert: Returns 400 status and error message
   
   - Test: "uses default model when model is not provided"
     - Mock fetch without `model` in body
     - Assert: Server processes and uses default

2. **Red phase:** Tests fail (server doesn't read or validate `model`).

3. **Green phase:** Modify `server/api/respond.post.ts`:
   - Read `model` from request body
   - If provided, validate against known models (fetch from `/api/models`)
   - If invalid, return 400
   - If missing or valid, use the provided model or default

4. **Refactor:** Extract model validation logic into a helper function.

5. **Format:** Run Prettier on files added or modified in this phase (for example, `server/api/respond.post.ts` and the related unit test file).

---

### Phase 3: Integration Tests for Server–OpenAI Flow

**Goal:** Verify the server passes the correct model to the OpenAI API.

1. **Write integration tests** (`tests/integration/respond-route.test.ts`):
   - Test: "includes selected model in upstream OpenAI request"
     - Mock `/api/respond` with a selected model
     - Assert: The fetch to OpenAI includes `"model": selectedModel`
   
   - Test: "includes default model when no model is selected"
     - Mock `/api/respond` without model
     - Assert: The fetch to OpenAI includes `"model": "gpt-4.1-mini"`
   
   - Test: "returns response with model used"
     - Mock successful OpenAI response
     - Assert: Response body includes `"model": "..."` field

2. **Red phase:** Tests fail (server doesn't pass model to OpenAI, response doesn't include model).

3. **Green phase:** Modify `server/api/respond.post.ts`:
   - Pass the resolved `model` (selected or default) to the OpenAI fetch call
   - Add `model` field to the success response
   - Ensure error responses are consistent

4. **Refactor:** Extract the model resolution logic.

5. **Format:** Run Prettier on files added or modified in this phase (for example, `server/api/respond.post.ts` and `tests/integration/respond-route.test.ts`).

---

### Phase 4: Type Updates

**Goal:** Ensure TypeScript types match the new request/response shape.

1. **Update types** (`types/chat.ts`):
   - `PromptRequest`: add optional `model?: string`
   - `ApiSuccessResponse`: add `model: string`

2. **Run typecheck:**
   ```
   npm run typecheck
   ```
   - Fix any type errors in the implementation code.

---

### Phase 5: E2E Tests

**Goal:** Verify the full user flow works end-to-end.

1. **Write E2E tests** (`tests/e2e/app.spec.ts`):
   - Test: "selecting a model and submitting uses that model"
     - Navigate to app
     - Select a specific model from dropdown
     - Enter a prompt
     - Submit
     - Assert: Response is generated (verify in UI)
   
   - Test: "submitting with no model selected uses default"
     - Navigate to app
     - Skip model selection (leave as no selection)
     - Enter a prompt
     - Submit
     - Assert: Response is generated with default model

2. **Red phase:** Tests fail (if model handling isn't fully wired).

3. **Green phase:** Ensure client + server + integration all work together.

4. **Refactor:** Clean up test setup/teardown.

5. **Format:** Run Prettier on files added or modified in this phase (for example, `tests/e2e/app.spec.ts` and any updated supporting test files).

---

### Phase 6: Accessibility & Help Text Validation

**Goal:** Ensure the UI remains accessible and help text is correct.

1. **Verify in `ModelsSelector.vue`:**
   - Help text should say "Uses gpt-4.1-mini if no model is selected." (matches spec)
   - `aria-describedby`, `aria-invalid` are correctly wired
   - No error is shown if no model is selected

2. **Write unit test** (`tests/unit/models-selector.test.ts`):
   - Test: "displays correct help text"
     - Assert: Help text matches specification

3. **No code changes needed if already aligned.**

---

## Modified Files Summary

| File | Changes |
|------|---------|
| `app/app.vue` | Include `model` in request body when selected |
| `server/api/respond.post.ts` | Read, validate, and use `model` parameter; pass to OpenAI |
| `types/chat.ts` | Add `model` to request/response types |
| `tests/unit/app.ui.test.ts` | Add client payload tests |
| `tests/integration/respond-route.test.ts` | Add server validation and OpenAI integration tests |
| `tests/e2e/app.spec.ts` | Add E2E flow tests |

## Test Execution Order

1. Run unit tests after Phase 1 (client payload)
2. Run unit tests after Phase 2 (server validation)
3. Run integration tests after Phase 3 (OpenAI flow)
4. Run typecheck after Phase 4 (types)
5. Run E2E tests after Phase 5 (full flow)
6. Final: `npm run test` (all tests) + `npm run typecheck`

## Acceptance Criteria

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ No TypeScript errors
- ✅ Client sends `model` when selected; omits when not
- ✅ Server validates and uses selected or default model
- ✅ Response includes the model used
- ✅ Help text remains: "Uses gpt-4.1-mini if no model is selected."
- ✅ Accessibility attributes (aria-describedby, aria-invalid) are correct
- ✅ No breaking changes to existing functionality

## Estimated Effort

- Unit tests: ~1-2 hours (writing tests + implementation)
- Integration tests: ~1-2 hours
- E2E tests: ~1 hour
- Type updates: ~15-30 minutes
- Accessibility/help text: ~15 minutes (validation only)
- Total: ~4-6 hours

## Risk Mitigation

- **Risk:** Breaking existing request/response format
  - **Mitigation:** Make `model` optional in request; always include in success response
  
- **Risk:** Invalid model causes OpenAI API failure
  - **Mitigation:** Fetch valid model IDs from `/api/models` on the server and validate incoming `model` against that set

- **Risk:** Tests fail due to incomplete mock setup
  - **Mitigation:** Leverage existing test utilities and mock patterns from current test suite

## Dependencies

- No new external dependencies required
- Uses existing testing frameworks (Vitest, Playwright, @vue/test-utils)
- Uses existing mock/fetch patterns from `tests/integration/respond-route.test.ts`
