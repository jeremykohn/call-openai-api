# Implementation Plan with Tasks: Modify Config Format

## Source of Requirements

- Spec file: `.github/specs/modify-config-format.md`
- Delivery style: Test-Driven Development (TDD) with explicit Red-Green-Refactor loops
- Required test scope: unit, integration, and end-to-end tests

## Goal

Implement the config schema update to include `available-models` while preserving existing filtering behavior and fallback safety.

### Desired End State

- `OpenAIModelsConfig` requires four keys:
  - `available-models`
  - `models-with-error`
  - `models-with-no-response`
  - `other-models`
- Config validation enforces the 4-key schema and string-array values.
- Canonical config writing preserves alphabetical key order.
- Existing filtering behavior remains unchanged:
  - exclude `models-with-error` and `models-with-no-response`
  - do not exclude by `available-models` or `other-models`
- Existing fallback behavior remains unchanged for missing/unreadable/invalid config.
- `server/assets/models/openai-models.json` and `.example` are updated to new schema.

---

## Implementation Principles

- Keep parsing/validation logic centralized in one utility module to avoid drift.
- Keep filtering logic pure and independent from file loading concerns.
- Preserve API/UI behavior unless required by the spec.
- Use deterministic, canonical serialization for config updates.
- Prefer small, independently testable steps per phase.

---

## Proposed Design Decisions

### Config Schema Contract
- Extend `OpenAIModelsConfig` with `available-models: string[]`.
- Keep existing three keys unchanged.
- Require all four keys for a config to be considered valid.

### Canonical Key Order
When writing or rewriting config JSON, serialize keys in this exact order:
1. `available-models`
2. `models-with-error`
3. `models-with-no-response`
4. `other-models`

### Migration Rule
- Legacy 3-key config inputs should be normalized to include `available-models: []` where migration/rewrite logic is used.
- Invalid schema still triggers existing fallback behavior (no crash).

---

## Phase 1 — Schema Contract Update (Unit TDD)

### Approach
Start with strict schema and parser/validator behavior before touching route integration.

### Red-Green-Refactor Loop
- **Red:** Add failing unit tests for the new 4-key schema.
- **Green:** Update types and parser/validator to satisfy tests.
- **Refactor:** Consolidate fixtures and helper builders for config objects.

### Tasks
1. Add/adjust unit tests for config parsing to require `available-models`.
2. Add a unit test that old 3-key shape is rejected by strict validator.
3. Add unit tests that each key must be an array and each entry must be a string.
4. Update `OpenAIModelsConfig` type to include `available-models`.
5. Update parser/validator logic to enforce the 4-key schema.
6. Refactor repeated test setup into helper fixtures.

### Phase Validation
- Run targeted unit tests for config schema parsing.
- Run typecheck for changed type/parser files.

---

## Phase 2 — Canonicalization & Migration Helpers (Unit TDD)

### Approach
Introduce a deterministic normalization helper used by config updates so key order and defaults are consistent.

### Red-Green-Refactor Loop
- **Red:** Add failing tests for canonical key order, uniqueness, and migration defaults.
- **Green:** Implement normalization/canonicalization helpers.
- **Refactor:** Separate normalization from serialization for clarity.

### Tasks
1. Add unit tests for canonical key order in serialized JSON output.
2. Add unit tests that migration/rewrite adds `available-models: []` for legacy data.
3. Add unit tests that output arrays remain string arrays and deduplicate entries.
4. Implement normalization helper that returns canonical 4-key object.
5. Implement serializer helper with stable formatting (2-space JSON + trailing newline).
6. Refactor helper naming to make migration vs strict-validation intent explicit.

### Phase Validation
- Run targeted unit tests for canonicalization/migration helpers.
- Re-run parser tests to ensure no regressions.

---

## Phase 3 — Config Files Update (Unit + Integration TDD)

### Approach
Update actual config files under `server/assets/models` and verify loader + route behavior with the new format.

### Red-Green-Refactor Loop
- **Red:** Add/adjust tests that currently depend on old 3-key files.
- **Green:** Update active and sample JSON files to 4-key schema.
- **Refactor:** Remove obsolete fixtures/assumptions that still expect legacy format.

### Tasks
1. Update `server/assets/models/openai-models.json` to include `available-models` in canonical key order.
2. Update `server/assets/models/openai-models.json.example` similarly.
3. Add/adjust unit tests to ensure these files parse as valid 4-key config.
4. Add/adjust integration tests for `/api/models` using the updated file format.
5. Ensure invalid/missing file scenarios still trigger fallback mode unchanged.
6. Refactor any duplicated config-file fixture content across tests.

### Phase Validation
- Run loader unit tests.
- Run `/api/models` integration tests.
- Run typecheck.

---

## Phase 4 — Preserve Filtering Behavior Contract (Integration TDD)

### Approach
Explicitly lock in the unchanged filtering behavior to prevent accidental use of `available-models`/`other-models` for exclusion.

### Red-Green-Refactor Loop
- **Red:** Add failing integration tests that assert non-exclusion by `available-models` and `other-models`.
- **Green:** Ensure filter implementation only excludes `models-with-error` and `models-with-no-response`.
- **Refactor:** Keep filter logic in one pure helper called by the route.

### Tasks
1. Add integration test: model listed only in `available-models` is still eligible for dropdown.
2. Add integration test: model listed only in `other-models` is still eligible for dropdown.
3. Add integration test: exclusion remains only for `models-with-error` + `models-with-no-response`.
4. Verify alphabetical ordering remains in both filtered and fallback modes.
5. Refactor filter helper usage to avoid branch-specific drift.

### Phase Validation
- Run focused integration tests for `/api/models` filtering and ordering.
- Re-run related unit tests for filter helper.

---

## Phase 5 — E2E Regression Coverage (TDD)

### Approach
Confirm no user-visible regressions in model dropdown behavior with the updated schema.

### Red-Green-Refactor Loop
- **Red:** Add/adjust failing e2e assertions where fixtures assume old schema.
- **Green:** Update test fixtures/mocks and selectors as needed.
- **Refactor:** Remove brittle assertions and keep tests behavior-focused.

### Tasks
1. Add/update e2e scenario for filtered model list with config-valid metadata.
2. Add/update e2e fallback scenario to confirm fallback note behavior remains unchanged.
3. Validate model dropdown ordering in both scenarios.
4. Ensure no test relies on deprecated 3-key config assumptions.

### Phase Validation
- Run targeted Playwright tests for model selector flows.
- Run adjacent existing e2e tests touching `/api/models` behavior.

---

## Phase 6 — Final Refactor, Docs Alignment, and Quality Gate

### Approach
Finalize with consistency checks, minimal doc alignment, and full quality sweep for modified files.

### Red-Green-Refactor Loop
- **Red:** Identify stale references to old schema in tests/docs touched by this work.
- **Green:** Update references to current 4-key schema and canonical order.
- **Refactor:** Simplify naming and remove dead code/fixtures.

### Tasks
1. Confirm all touched docs/comments reference the 4-key schema accurately.
2. Confirm no logic accidentally introduces out-of-scope behavior.
3. Run formatting for modified `.ts`/`.vue` files.
4. Run full relevant test stack in order:
   - unit,
   - integration,
   - e2e.
5. Run typecheck and ensure zero new errors.
6. Review final diff against acceptance criteria from spec.

### Phase Validation
- Unit, integration, and e2e tests green.
- Typecheck green.
- Acceptance criteria satisfied without out-of-scope additions.

---

## Suggested Test Matrix

### Unit
- 4-key config schema validation
- missing `available-models` rejection in strict mode
- canonical key-order serialization
- migration helper adds empty `available-models`
- filter helper exclusions unchanged

### Integration
- `/api/models` with valid 4-key config
- `/api/models` fallback behavior for invalid/missing config
- `/api/models` ignores `available-models` and `other-models` for exclusion
- alphabetical ordering in all modes

### End-to-End
- config-valid dropdown behavior (filtered list + no fallback note)
- fallback dropdown behavior (full list + fallback note)
- no regression in selection flow

---

## Risks and Watchpoints

- Accidentally treating `available-models` as an exclusion source would violate spec.
- Legacy fixtures with old 3-key shape may silently break tests if not updated.
- Canonical key-order requirements can drift if multiple serializers are introduced.
- Migration behavior must not weaken strict validation paths unintentionally.

---

## Out-of-Scope Guardrails

Do not include work for:
- auto-classifying successful query results into `available-models`
- runtime route-side config mutation
- UI features that expose `available-models` directly
- changing fallback message text or route contract beyond current behavior
