# Application Specification: Refactor Fallback UI Message to a Shared Constant

## Overview

This specification defines a behavior-preserving refactor that removes duplicated literal text for the models fallback note and centralizes it in a single exported constant.

Target message text (exact):

`Note: List of OpenAI models may include some older models that are no longer available.`

The same exact text is currently repeated in UI, tests, and documentation and should be sourced from one constant wherever feasible in code and test runtime.

## Objective

- Define one shared constant for the fallback note message.
- Replace hard-coded message usage in UI and tests with that constant.
- Align documentation usage (`README.md`) so wording remains exact and synchronized with the constant value.
- Preserve all existing behavior and assertions.

---

## Current Duplication (Source of Truth Audit)

The target message currently appears in these files (minimum required set):

- `README.md`
- `app/components/ModelsSelector.vue`
- `tests/e2e/models-selector.spec.ts`
- `tests/unit/models-selector/rendering.test.ts`

It may also appear in other spec/prompt docs, but this change is primarily about application/runtime and test consistency plus README alignment.

---

## Desired End State

- The fallback note message is defined exactly once in a shared constants module.
- Runtime UI (`ModelsSelector.vue`) references the shared constant.
- Unit and e2e tests reference the shared constant for exact text assertions.
- `README.md` contains wording that matches the shared constant exactly, with no drift.
- Fallback note rendering conditions and accessibility semantics remain unchanged.
- Existing tests remain green.

---

## Scope

### In Scope

1. Add or reuse a single exported constant for fallback note text in the shared constants area (for example, `shared/constants/models.ts`).
2. Replace hard-coded fallback note text in:
   - `app/components/ModelsSelector.vue`
   - `tests/e2e/models-selector.spec.ts`
   - `tests/unit/models-selector/rendering.test.ts`
3. Update `README.md` fallback note wording to exactly match the constant text.
4. Update any imports/types needed for TypeScript/lint correctness.
5. Add/adjust tests needed to preserve exact-text guarantees and behavior.

### Out of Scope

- Changing fallback note wording.
- Changing fallback note visibility logic.
- Changing fallback note accessibility behavior (`aria-describedby`, element IDs, test IDs).
- Refactoring unrelated strings.
- Reworking markdown generation/documentation architecture beyond this message alignment.

---

## Functional Requirements

### 1) Shared Constant Definition

A single exported constant must define the fallback message in a shared constants module used by app code and tests.

Required value (exact):

`Note: List of OpenAI models may include some older models that are no longer available.`

### 2) UI Consumption

`app/components/ModelsSelector.vue` must use the shared constant value for fallback note text instead of hard-coding the literal in template markup.

Rendered output must remain text-identical when fallback mode is active.

### 3) Test Consumption

Both test files must use the same shared constant when validating fallback note text:

- `tests/e2e/models-selector.spec.ts`
- `tests/unit/models-selector/rendering.test.ts`

Tests must continue asserting the exact expected user-visible text.

### 4) README Alignment

`README.md` must include fallback note wording that exactly matches the shared constant value.

Because markdown is static text, README does not import runtime constants; therefore, this requirement is wording synchronization, not code import.

### 5) Single-Source Rule for Runtime/Test Code

No hard-coded copy of the fallback message should remain in the targeted runtime/test files after refactor.

---

## Non-Functional Requirements

- Keep the change minimal and localized.
- Preserve TypeScript correctness and import conventions.
- Keep tests readable and maintainable with descriptive constant naming.
- Keep documentation clear and accurate.

---

## Suggested Constant Naming

Use a semantically clear constant name, for example:

- `MODELS_FALLBACK_NOTE_TEXT`

Equivalent naming is acceptable if unambiguous and consistent with project style.

---

## Acceptance Criteria

1. A single exported constant exists with the exact fallback message text.
2. `ModelsSelector.vue` no longer hard-codes the fallback message.
3. `tests/e2e/models-selector.spec.ts` no longer hard-codes the fallback message.
4. `tests/unit/models-selector/rendering.test.ts` no longer hard-codes the fallback message.
5. `README.md` uses wording that exactly matches the constant text.
6. Fallback note rendering behavior remains unchanged.
7. Relevant unit and e2e tests pass; integration tests used as regression guard pass.

---

## Verification Plan

### Static Verification

- Search for the exact literal in target app/test files and confirm it is removed in favor of the constant.
- Verify `README.md` contains the exact expected wording.

### Runtime/Test Verification

- Run targeted unit tests:
  - `tests/unit/models-selector/rendering.test.ts`
- Run targeted e2e tests:
  - `tests/e2e/models-selector.spec.ts`
- Run integration regression smoke:
  - models-related integration suite (to ensure no incidental regressions)

### Optional Broader Validation

- related models-selector unit suites
- full e2e suite

---

## Risks and Mitigations

- **Risk:** Import path alias differences between app and tests.
  - **Mitigation:** Use existing alias conventions already present in project tests and app (`~~/shared/constants/...`).

- **Risk:** Text drift from punctuation/whitespace edits.
  - **Mitigation:** Keep constant value exact and assert exact equality in unit/e2e tests.

- **Risk:** Ambiguity around README using constants directly.
  - **Mitigation:** Treat README requirement as exact wording alignment, not runtime import.

---

## Notes

This is a maintainability refactor. It must not change user-facing fallback behavior, only centralize runtime/test message ownership and keep documentation text aligned.
