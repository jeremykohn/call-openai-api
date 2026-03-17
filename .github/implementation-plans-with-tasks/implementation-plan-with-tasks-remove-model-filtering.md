# Implementation Plan: Remove Model Filtering and Capability Verification

## Test-Driven Development Approach

### Overview

This plan implements the removal of model filtering and per-model capability verification from the Nuxt app, using a Red-Green-Refactor TDD cycle. Each phase builds on prior phases and maintains a green test suite throughout.

---

## Phase 1: Establish Test Infrastructure & Type Cleanup

**Objective:** Create test harnesses and remove unused capability types before modifying routes/logic.

**Approach:**

- Write failing unit tests for the new unfiltered behavior of `/api/models` before changing the route.
- Test the new submit validation behavior before updating it.
- Clean up types to remove `capabilityUnverified` so the test expectations align with the target state.
- Ensure all existing tests are updated to reflect the new behavior, then run green.

### Phase 1 Tasks

#### 1.1 Update `types/models.ts` — Remove `capabilityUnverified` field (Red)

- **Task:** Remove the optional `capabilityUnverified?: boolean` field from the `OpenAIModel` type.
- **Why first:** Removing the type forces TypeScript to fail at compilation until all usages are updated, directing us to affected code paths.
- **Expected outcome:** TypeScript compilation errors in files that reference the removed field; this is intentional red-green guidance.
- **Test verification:** `tsc --noEmit` will show type errors.

#### 1.2 Create unit test file for modified `/api/models` route (Red)

- **Task:** Create `tests/unit/models-route-unfiltered.test.ts` with failing tests:
  - Test: route returns all models from upstream payload without filtering.
  - Test: route does not call capability discovery functions.
  - Test: route response includes models with any status from upstream.
  - Test: route removes `capabilityUnverified` from response (if it was previously added).
- **Why:** Establish the expected contract before changing the route implementation.
- **Expected outcome:** Tests fail because the route still has filtering logic.

#### 1.3 Create unit test file for modified validation logic (Red)

- **Task:** Create `tests/unit/openai-model-validation-no-capability.test.ts` with failing tests:
  - Test: validation accepts any model present in models list.
  - Test: validation does not reject model due to missing `capabilityUnverified` data.
  - Test: validation rejects only missing/empty/not-found/fetch-error scenarios.
- **Why:** Define the new contract for submit-time validation.
- **Expected outcome:** Tests fail because validation still includes capability checks.

#### 1.4 Create unit test file for modified dropdown component (Red)

- **Task:** Create `tests/unit/models-selector-unfiltered.test.ts` with failing tests:
  - Test: component renders all models from props without filtering.
  - Test: component does not render caveat text about unverified availability.
  - Test: component does not include ARIA references to capability status.
  - Test: component preserves label, required state, error handling.
- **Why:** Establish expected dropdown behavior.
- **Expected outcome:** Tests fail because component still has caveat logic.

#### 1.5 Update imports across codebase to address type removal (Green)

- **Task:** Fix TypeScript compilation errors from removing `capabilityUnverified`:
  - Remove usages in model filtering logic (in `/api/models` and validation).
  - Remove usages in UI components that referenced the field.
  - Remove type annotations that included the field.
- **Why:** Resolve compilation errors introduced in 1.1, guiding us to all affected paths.
- **Expected outcome:** `tsc --noEmit` succeeds with no errors.

---

## Phase 2: Simplify `/api/models` Route — Remove Capability Verification

**Objective:** Refactor the server route to return unfiltered models directly from OpenAI.

**Approach:**

- Update `/api/models` to build the response directly from the upstream payload without capability filtering.
- Remove capability discovery/probing calls.
- Remove capability-based inclusion/exclusion logic.
- Remove override-based filtering.
- Keep existing error handling and security validation.
- Run unit tests; they should transition from red to green.

### Phase 2 Tasks

#### 2.1 Simplify `/api/models` route: remove capability pipeline (Green)

- **Task:** Refactor `server/api/models.get.ts`:
  - Remove calls to `discoverModelCandidates`, `probeModelCapabilities`, `resolveModelCapability`.
  - Remove calls to `loadAllowedModelsOverrides`.
  - Build `data` directly by mapping `payload.data` models (keeping id, object, created, owned_by).
  - Keep existing error handling, config validation, and host allow-list checks.
  - Keep existing response structure `{ object: "list", data: models }`.
- **Why:** Remove filtering logic so all models pass through.
- **Expected outcome:** Unit tests from 1.2 turn green; no capability-based filtering occurs.

#### 2.2 Update models-route tests: remove filtering assertions (Green)

- **Task:** Update any existing `tests/unit/server/models.get.test.ts` tests:
  - Remove or update tests that assert capability filtering happens.
  - Add assertions that models from upstream all appear in response.
  - Ensure tests pass with the simplified route.
- **Why:** Existing tests may have checked for filtering; they need to verify passthrough instead.
- **Expected outcome:** All models-route unit tests pass.

#### 2.3 Run integration test: `/api/models` with diverse upstream models (Green)

- **Task:** Create or update `tests/integration/models-route.test.ts`:
  - Mock OpenAI response with a diverse set of models (chat, embedding, image, deprecated, etc.).
  - Assert that all models appear in `/api/models` response.
  - Assert no capability probe calls occur (mock them out and verify never called).
- **Why:** Verify the route behavior at the HTTP level.
- **Expected outcome:** Integration tests pass; all mocked models are returned.

#### 2.4 Run full test suite to ensure no regressions (Green)

- **Task:** Run `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
- **Why:** Verify that route simplification does not break other parts of the system.
- **Expected outcome:** All tests pass or only expected failures from phases not yet completed.

---

## Phase 3: Update Model Validation — Remove Capability Checks

**Objective:** Simplify submit-time validation to accept any listed model without capability verification.

**Approach:**

- Update `openai-model-validation.ts` to remove capability-unverified rejection.
- Keep model-existence checks (model must be in the list).
- Update tests to verify the new behavior.

### Phase 3 Tasks

#### 3.1 Simplify model validation: remove capability checks (Green)

- **Task:** Refactor `server/utils/openai-model-validation.ts`:
  - Remove any check that rejects a model due to `capabilityUnverified` or capability status.
  - Keep check: model is present in fetched model list.
  - Keep check: model is not empty/missing.
  - Keep check: ability to fetch model list (502 error path if list fetch fails).
- **Why:** Accept any model present in the list, regardless of former capability status.
- **Expected outcome:** Unit tests from 1.3 turn green.

#### 3.2 Update validation tests: remove capability rejection tests (Green)

- **Task:** Update existing `tests/unit/openai-model-validation.test.ts` or create new tests:
  - Remove tests that assert capability-based rejection.
  - Add tests that assert all listed models are accepted.
  - Add tests that verify only missing/not-found scenarios are rejected.
- **Why:** Ensure tests reflect new validation contract.
- **Expected outcome:** All validation unit tests pass.

#### 3.3 Run integration test: submit with any listed model (Green)

- **Task:** Create or update `tests/integration/respond-route-model-validation.test.ts`:
  - Mock `/api/models` to return diverse models (including formerly filtered ones).
  - Submit request with each model from the list.
  - Assert no model is rejected due to capability verification.
- **Why:** Verify submit flow accepts all listed models.
- **Expected outcome:** Integration tests pass; all models are accepted.

---

## Phase 4: Update UI Component — Remove Capability Caveat

**Objective:** Remove unverified-availability messaging and related ARIA references from the dropdown.

**Approach:**

- Update `ModelsSelector.vue` to remove capability-based caveats and related ARIA/accessibility references.
- Keep baseline accessibility semantics (label, required state, error handling).
- Update component tests to verify caveat is removed.

### Phase 4 Tasks

#### 4.1 Remove caveat logic from `ModelsSelector.vue` (Green)

- **Task:** Refactor `app/components/ModelsSelector.vue`:
  - Remove the `capabilityUnverified` caveat paragraph (the "unverified availability" message).
  - Remove ARIA references that associated caveat text with the select (e.g., `aria-describedby` entries for caveat).
  - Remove the `hasUnverifiedModels` computed property.
  - Remove the conditional rendering of caveat text.
  - Keep: label, required indicator, helper text, error handling, error details toggle.
- **Why:** Eliminate capability-based UX messaging.
- **Expected outcome:** Unit tests from 1.4 turn green.

#### 4.2 Update component tests: remove caveat assertions (Green)

- **Task:** Update `tests/unit/ModelsSelector.test.ts`:
  - Remove tests that check for caveat text appearance.
  - Remove tests that check for unverified-model indicators.
  - Add tests that verify caveat text is NOT rendered.
  - Keep tests for label, required state, error handling, keyboard navigation.
- **Why:** Ensure tests reflect removal of caveat.
- **Expected outcome:** All component unit tests pass.

#### 4.3 Run E2E test: dropdown loads and displays all models (Green)

- **Task:** Create or update `tests/e2e/models-selector.spec.ts`:
  - Mock `/api/models` to return diverse models.
  - Load the app and wait for models to load.
  - Assert dropdown contains all models.
  - Assert no "unverified" or "availability" language is visible.
  - Verify keyboard navigation and basic accessibility.
- **Why:** Verify dropdown works end-to-end with no caveat messaging.
- **Expected outcome:** E2E tests pass; all models appear in dropdown.

#### 4.4 Run full test suite (Green)

- **Task:** Run `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
- **Why:** Verify component changes do not break other parts.
- **Expected outcome:** All tests pass.

---

## Phase 5: Remove Unused Capability Infrastructure (Refactor)

**Objective:** Clean up imports and utility functions that are no longer used by the models route.

**Approach:**

- After phases 2–4, verify which capability utilities are still used elsewhere in the codebase.
- Remove imports from `/api/models` route that are no longer called.
- If capability utilities become completely unused, consider removing them entirely or keeping them for other potential use cases.
- Ensure all tests still pass.

### Phase 5 Tasks

#### 5.1 Audit capability utility usage (Refactor)

- **Task:** Scan the codebase for usages of:
  - `discoverModelCandidates`
  - `probeModelCapabilities`
  - `resolveModelCapability`
  - `loadAllowedModelsOverrides`
  - Capability-related metrics/observability calls (from models.get context).
- **Why:** Understand if these utilities are still used anywhere after our changes.
- **Expected outcome:** List of files that use/don't use each utility.

#### 5.2 Remove unused imports from `/api/models` (Refactor)

- **Task:** In `server/api/models.get.ts`, remove import statements for utilities identified as unused in 5.1.
- **Why:** Clean up the route file.
- **Expected outcome:** No unused imports; code is more readable.

#### 5.3 Optionally remove/deprecate unused utility files (Refactor)

- **Task:** If a capability utility (e.g., `model-capability-discovery.ts`) is no longer used anywhere:
  - Option A: Remove the file (if confident it's not needed for future features).
  - Option B: Keep the file but mark it as deprecated/legacy in comments (if it might be useful later).
  - Decision: Defer full removal; mark as "deprecated as of [date]" in comments for now to avoid breaking future features.
- **Why:** Avoid breaking potential dependent code; mark for future cleanup.
- **Expected outcome:** Capability utilities are cleaned up or marked deprecated.

#### 5.4 Run full test suite (Green)

- **Task:** Run `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`.
- **Why:** Verify cleanup does not introduce regressions and code quality remains high.
- **Expected outcome:** All tests pass; no lint or type errors.

---

## Phase 6: Update Documentation and README (Refactor)

**Objective:** Update operational documentation to reflect the removal of capability filtering.

**Approach:**

- Update `README.md` to remove references to model filtering or capability verification.
- Update code comments in affected files to describe the new unfiltered behavior.
- Update any internal runbooks or documentation that described the old filtering behavior.

### Phase 6 Tasks

#### 6.1 Update README.md (Refactor)

- **Task:** In `README.md`:
  - Find and remove or update any section describing model filtering or capability checks.
  - If there's a "Model Selection" or "Model Support" section, update it to reflect all OpenAI models are now available.
  - Update any note about "unverified models" to clarify they are no longer a concept in the app.
- **Why:** Keep documentation in sync with implementation.
- **Expected outcome:** README accurately reflects new behavior.

#### 6.2 Add code comments explaining unfiltered passthrough (Refactor)

- **Task:** In `server/api/models.get.ts`, add a comment at the top explaining:
  - The route returns all models from OpenAI without filtering.
  - Capability verification is not performed; all models are passed through as-is.
  - Security checks (config, host allow-list) are still in place.
- **Why:** Future maintainers understand the intentional design.
- **Expected outcome:** Code is self-documenting.

#### 6.3 Run full test suite (Green)

- **Task:** Run `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
- **Why:** Verify documentation changes do not affect code.
- **Expected outcome:** All tests pass.

---

## Phase 7: Final Integration and Verification (Refactor)

**Objective:** Run comprehensive tests and manual verification to ensure all changes work together.

**Approach:**

- Run all test suites with coverage reporting.
- Manually verify the app behavior with real or high-fidelity mocks.
- Verify no regressions in unrelated features.

### Phase 7 Tasks

#### 7.1 Run all tests with coverage reporting (Green)

- **Task:** Run:
  ```
  npm run test:unit -- --coverage
  npm run test:integration -- --coverage
  npm run test:e2e
  npm run lint
  npm run typecheck
  ```
- **Why:** Comprehensive verification of code quality and test coverage.
- **Expected outcome:** All tests pass; coverage remains above project baseline.

#### 7.2 Manual verification: Load app and test dropdown (Green)

- **Task:** Run the dev server (`npm run dev`):
  - Load the app in a browser.
  - Verify models dropdown loads and shows all available models.
  - Verify no "unverified" caveat appears.
  - Select a model and submit a prompt; verify the flow works end-to-end.
  - Verify error states still work (e.g., simulate API failure).
- **Why:** Real-world verification of the feature.
- **Expected outcome:** App works as expected; no unexpected errors or UI glitches.

#### 7.3 Verify related features are unaffected (Green)

- **Task:** Test that unrelated features still work:
  - Chat prompt submission with default model.
  - Chat prompt submission with selected model.
  - Error message display for failed API calls.
  - Loading states and spinners.
- **Why:** Ensure no collateral damage to other features.
- **Expected outcome:** Related features work as before.

#### 7.4 Create a summary of changes (Refactor)

- **Task:** Document (in comments or a PR description template):
  - All files modified.
  - All tests added/updated.
  - Breaking changes (if any) and migration guidance.
  - Performance improvements (faster `/api/models` due to no probing).
- **Why:** Enable smooth review and handoff.
- **Expected outcome:** Clear change summary for stakeholders.

---

## Dependency Graph & Test Ordering

### Suggested Test Execution Order (by phase):

1. **Phase 1:** Type cleanup → TypeScript compilation.
2. **Phase 2:** Models route tests → Integration tests → Full suite.
3. **Phase 3:** Validation tests → Integration tests → Full suite.
4. **Phase 4:** Component tests → E2E tests → Full suite.
5. **Phase 5:** Refactor (all tests should still pass).
6. **Phase 6:** Documentation (no code impact).
7. **Phase 7:** Final comprehensive testing.

### Critical Path:

- Type cleanup (1.1) enables all subsequent phases.
- Route simplification (2.1) must complete before validation changes (3.1) can be tested.
- Validation changes (3.1) must complete before component changes can be safely tested (4.1).
- All unit/integration tests must pass before E2E tests are run.

---

## Test-Driven Development Cycle Summary

Each phase follows the Red-Green-Refactor pattern:

1. **Red:** Write failing tests that define the desired behavior.
2. **Green:** Implement the minimal code changes to make tests pass.
3. **Refactor:** Clean up, remove unused code, update documentation, ensure no regressions.

By completing all phases in order with tests passing throughout, we ensure:

- The codebase remains in a functional state at all times.
- Changes are driven by well-defined test contracts.
- Regressions are caught immediately by test failures.
- Code quality and coverage are maintained.

---

## Manual Steps

- **Incremental commits:** After each phase (or even after each task), make a commit so progress is trackable and rollback is possible if needed.
- **CI/CD integration:** Run the full test suite on each commit to catch issues early.
- **Code review:** Each phase should be reviewable as a cohesive set of changes before moving to the next phase.
- **Monitoring:** After deployment, monitor for any unexpected behavior or errors in production (e.g., models that fail at response time due to upstream constraints).
