# Implementation Plan with Tasks: Refactor Fallback UI Message

## Source of Requirements

- Spec file: `.github/specs/refactor-ui-message`
- Delivery style: Test-Driven Development (TDD) with Red-Green-Refactor loops
- Required test scope: unit, integration, and end-to-end tests

## Goal

Refactor the fallback note message to a single shared constant and replace hard-coded usages in UI and tests, while keeping `README.md` wording exactly aligned with the same text and preserving existing behavior.

### Desired End State

- One shared exported constant defines the fallback note text.
- `app/components/ModelsSelector.vue` renders the shared constant.
- `tests/e2e/models-selector.spec.ts` and `tests/unit/models-selector/rendering.test.ts` use the shared constant for assertions.
- `README.md` fallback-note wording exactly matches the constant value.
- Fallback visibility behavior and accessibility semantics remain unchanged.
- Relevant unit, integration, and e2e tests remain green.

---

## Implementation Principles

- Keep this refactor minimal and behavior-preserving.
- Preserve exact text, punctuation, and spacing.
- Use existing constant conventions and alias patterns already used in the repo.
- Keep runtime/test single-source ownership strict; treat README as synchronized static wording (not imported runtime code).
- Validate with targeted tests first, then broader regression checks.

---

## Phase 1 — Define Shared Constant and Baseline Guard (TDD)

### Approach

Establish the single source of truth first, then create a baseline test guard that locks exact message text to prevent future drift.

### Red-Green-Refactor Loop

- **Red:** Add/update a failing unit-level assertion that expects the shared constant with exact fallback text.
- **Green:** Define/export the constant in shared constants.
- **Refactor:** Keep naming and placement consistent with existing constants organization.

### Tasks

1. Confirm target constants file location (expected: `shared/constants/models.ts`).
2. Add/update a unit-level check for exact fallback message value through the constant.
3. Add exported constant (e.g., `MODELS_FALLBACK_NOTE_TEXT`) with exact text:
   - `Note: List of OpenAI models may include some older models that are no longer available.`
4. Ensure export style matches module conventions.
5. Refactor constant naming or placement only if needed for coherence.

### Phase Validation

- Run targeted unit tests that include the constant value guard.
- Run typecheck for touched constants/tests.

---

## Phase 2 — Replace Runtime UI Literal with Constant (TDD)

### Approach

Switch the component to consume the constant while preserving current rendering conditions and accessibility wiring.

### Red-Green-Refactor Loop

- **Red:** Add/update component test to fail if fallback note text is not sourced through expected constant-backed value.
- **Green:** Replace hard-coded template text in `ModelsSelector.vue` with imported constant.
- **Refactor:** Keep template readability and avoid changing conditional/ARIA logic.

### Tasks

1. Add/update unit/component test coverage for fallback note exact-text behavior.
2. Import shared constant in `app/components/ModelsSelector.vue`.
3. Replace hard-coded fallback note literal with constant reference.
4. Verify unchanged behavior for `showFallbackNote` condition.
5. Verify unchanged `id`, `data-testid`, and `aria-describedby` behavior.

### Phase Validation

- Run targeted models-selector unit tests (rendering + accessibility where relevant).
- Run typecheck for Vue/component changes.

---

## Phase 3 — Replace Test Literals with Shared Constant (TDD)

### Approach

Update both target test files to consume the same shared constant to eliminate duplicated hard-coded strings in test logic.

### Red-Green-Refactor Loop

- **Red:** Update one target test to use constant import and observe failing state until wiring is complete.
- **Green:** Replace literals in both target tests and restore pass state.
- **Refactor:** Remove now-redundant local fallback-note string variables.

### Tasks

1. Update `tests/unit/models-selector/rendering.test.ts` to import and use the shared constant.
2. Update `tests/e2e/models-selector.spec.ts` to import and use the shared constant.
3. Remove duplicate local literal/constant declarations for this message in those files.
4. Ensure assertions remain exact-text assertions (via shared constant value).
5. Verify no hard-coded copy remains in these two files.

### Phase Validation

- Run targeted unit test: `tests/unit/models-selector/rendering.test.ts`.
- Run targeted e2e test: `tests/e2e/models-selector.spec.ts`.

---

## Phase 4 — README Wording Synchronization (Refactor)

### Approach

Align `README.md` text with the constant value exactly, without introducing runtime coupling into markdown.

### Red-Green-Refactor Loop

- **Red:** Add a static verification step that compares README fallback-note wording against the required exact message.
- **Green:** Update README wording if mismatched.
- **Refactor:** Keep documentation concise and consistent with feature behavior descriptions.

### Tasks

1. Locate fallback-note wording in `README.md`.
2. Compare wording to shared constant value character-for-character.
3. Update README text if needed so it exactly matches the constant message.
4. Verify surrounding README context remains accurate and unchanged in intent.
5. Re-run static search to ensure no unintended wording drift in targeted files.

### Phase Validation

- Static verification confirms README exact wording alignment.
- Target runtime/test files remain constant-driven.

---

## Phase 5 — Regression Guard, Single-Source Enforcement, and Quality Gate (TDD + Refactor)

### Approach

Perform final regression with unit/integration/e2e coverage and enforce single-source rule in targeted runtime/test files.

### Red-Green-Refactor Loop

- **Red:** Run static search for raw literal in targeted runtime/test files and fail if any remain.
- **Green:** Remove residual literals and rerun tests.
- **Refactor:** Keep final diff minimal and strictly scoped to message-centralization.

### Tasks

1. Run static search for exact literal across app/tests.
2. Confirm target files (`ModelsSelector.vue`, `models-selector.spec.ts`, `rendering.test.ts`) do not hard-code the message.
3. Run integration regression smoke (models-related integration suite) to detect incidental regressions.
4. Re-run targeted unit and e2e suites for final confidence.
5. Run typecheck and format touched `.ts`/`.vue` files.
6. Review final diff for scope compliance (no behavior changes).

### Phase Validation

- Single-source rule enforced for targeted runtime/test files.
- README wording aligned exactly.
- Unit, integration, and e2e checks pass.
- Formatting/typecheck pass for modified files.

---

## Suggested Test Matrix

### Unit

- Shared constant exact value assertion.
- `ModelsSelector` fallback-note rendering assertion using shared constant.

### Integration

- Models-related integration suite smoke (regression guard).

### End-to-End

- `models-selector` fallback-note scenario using shared constant-backed expected text.

---

## Risks and Mitigations

- **Risk:** Import alias differences between app and tests.
  - **Mitigation:** Use existing alias conventions (`~~/shared/constants/...`) already present in repo.
- **Risk:** Message drift from punctuation/whitespace edits.
  - **Mitigation:** Exact-value assertion + README exact-match verification.
- **Risk:** Accidental behavior changes during small refactor.
  - **Mitigation:** Keep visibility/ARIA logic untouched and run targeted regression tests.

---

## Out-of-Scope Guardrails

Do not include:

- changing fallback message wording
- changing fallback-note visibility conditions
- changing API payload shape/behavior
- refactoring unrelated text/messages
- introducing runtime imports into markdown content
