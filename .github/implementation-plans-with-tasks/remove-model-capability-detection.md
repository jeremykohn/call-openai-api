# Implementation Plan with Tasks: Remove Model Capability Detection

## Source of Requirements

- Spec file: `.github/specs/remove-model-capability-detection.md`
- Clarification from user: `/api/models` response caching remains required, but as **model-list caching** (not capability caching)
- Delivery style: Test-Driven Development (TDD) with Red-Green-Refactor loops
- Required test scope: unit, integration, and end-to-end tests

## Goal

Remove all runtime capability detection/discovery/confirmation and capability cache logic, while preserving secure `/api/models` behavior and retaining response caching under neutral model-list cache semantics.

### Desired end state

- No runtime use of capability probe/discovery/resolution APIs.
- No runtime capability cache map or capability cache records.
- `/api/models` still supports response caching with a non-capability cache module/constant.
- Capability-only tests are removed.
- Remaining route/UI behavior stays stable and tests remain green.

---

## Implementation Principles

- Keep `/api/models` contract stable (`object`, `data`) unless tests/docs already require additional metadata.
- Preserve existing security checks and error sanitization.
- Prefer small, reversible steps with test-first validation.
- Remove dead code only after replacement paths are proven by tests.
- Keep naming explicit: “models response cache” instead of “capability cache.”

---

## Phase 1 — Define New Cache Boundary (TDD)

### Approach

Before deleting capability modules, isolate model-list response caching behind a neutral cache utility so `/api/models` can keep caching behavior without importing capability code.

### Red-Green-Refactor Loop

- **Red:** Add failing unit tests for neutral model-list cache behavior (fresh/stale/read/write/in-flight refresh).
- **Green:** Implement neutral cache utility with dedicated TTL constant.
- **Refactor:** Remove capability-oriented naming and duplicate cache helper logic.

### Tasks

1. Add a new utility module (for example `server/utils/models-response-cache.ts`).
2. Define a dedicated TTL constant in the new module (or route-level config), independent of `CAPABILITY_CACHE_TTL_MS`.
3. Port cache APIs currently used by `/api/models`:
   - read cached response
   - write cached response
   - clear cached response
   - track background refresh in-flight state
4. Create unit tests for read/write freshness behavior using deterministic timestamps.
5. Create unit tests for stale-return + background-refresh triggering behavior.
6. Create unit tests for in-flight refresh de-duplication behavior.
7. Refactor old cache test file naming/imports to neutral cache semantics.

### Phase Validation

- Run targeted unit tests for the new response-cache utility.
- Run typecheck for affected files.

---

## Phase 2 — Rewire `/api/models` to Neutral Cache (TDD)

### Approach

Switch route imports and usage from capability-labeled cache utilities to the neutral model-list cache utility without changing response semantics.

### Red-Green-Refactor Loop

- **Red:** Add/adjust integration tests that assert route caching behavior independent of capability modules.
- **Green:** Rewire route to new cache utility and preserve behavior.
- **Refactor:** Simplify route cache branches and eliminate transitional duplication.

### Tasks

1. Add/adjust integration test: fresh cached models are returned when available.
2. Add/adjust integration test: stale cached models are served while refresh is triggered.
3. Add/adjust integration test: no capability module import is required for route caching.
4. Update `server/api/models.get.ts` to import and use neutral response-cache functions.
5. Remove any remaining route references to capability constants or types.
6. Keep existing security behavior intact:
   - API key/runtime config validation
   - allowed-host validation
   - upstream error sanitization

### Phase Validation

- Run targeted integration tests for `tests/integration/models.test.ts` (or equivalent route suite).
- Run route-adjacent unit tests and typecheck.

---

## Phase 3 — Remove Capability Runtime Modules (TDD)

### Approach

After route rewiring is green, remove capability-runtime code and enforce absence through failing tests/search assertions first.

### Red-Green-Refactor Loop

- **Red:** Add/adjust tests that fail if removed capability APIs are still imported/used by runtime modules.
- **Green:** Delete capability modules and references.
- **Refactor:** Clean residual types/imports and simplify any fallback branches.

### Tasks

1. Identify all runtime imports/usages of:
   - `resolveModelCapability`
   - `probeModelCapability` / `probeModelCapabilities`
   - `discoverModelCandidates`
   - `CAPABILITY_CACHE_TTL_MS`
   - `AllowedModelsOverrides`
2. Remove capability core module usage and delete `server/utils/model-capability.ts` if unused.
3. Remove discovery/probe module usage and delete `server/utils/model-capability-discovery.ts`.
4. Remove override loader usage and delete `server/utils/model-capability-overrides.ts`.
5. Remove observability usage and delete `server/utils/model-capability-observability.ts`.
6. Remove legacy capability-related config references in runtime code paths.

### Phase Validation

- Run project-wide grep checks for forbidden capability runtime symbols.
- Run unit + integration tests for affected areas.

---

## Phase 4 — Remove/Update Capability Tests (TDD)

### Approach

Delete tests that only validate removed behavior and migrate tests that still provide value (now against neutral cache behavior).

### Red-Green-Refactor Loop

- **Red:** Remove obsolete tests first and observe failing coverage gaps.
- **Green:** Add/adjust replacement tests for retained behavior.
- **Refactor:** Consolidate fixtures/helpers to avoid duplication.

### Tasks

1. Remove capability-only test files:
   - `tests/integration/model-capability-discovery.test.ts`
   - `tests/unit/model-capability.test.ts`
   - `tests/unit/model-capability-discovery.test.ts`
   - `tests/unit/model-capability-overrides.test.ts`
   - `tests/unit/model-capability-observability.test.ts`
2. Migrate `tests/unit/model-capability-models-cache.test.ts` to neutral cache test scope/name/imports.
3. Update any route tests still asserting capability statuses or capability-derived fields.
4. Ensure no remaining tests depend on `CAPABILITY_CACHE_TTL_MS`.
5. Add/adjust tests as needed so `/api/models` caching behavior remains fully covered.

### Phase Validation

- Run targeted unit and integration test groups for all modified/deleted tests.
- Confirm no broken imports from removed test targets.

---

## Phase 5 — Documentation and Spec Consistency (Refactor)

### Approach

Align docs with implementation so no active-runtime documentation still describes capability detection/caching.

### Red-Green-Refactor Loop

- **Red:** Identify stale doc references and expected wording gaps.
- **Green:** Update docs/spec references to current behavior.
- **Refactor:** Normalize terminology for cache naming consistency.

### Tasks

1. Update `README.md` to remove statements implying active runtime capability detection/probing/caching.
2. Ensure docs describe retained `/api/models` response caching as model-list caching.
3. Update internal docs/specs/plans if they still present capability runtime logic as current behavior.
4. Verify terminology consistency across docs:
   - “model-list cache” / “models response cache”
   - avoid “capability cache” for retained route caching

### Phase Validation

- Run markdown/doc checks used in this repo (if configured).
- Manually verify edited docs are accurate and non-contradictory.

---

## Phase 6 — Final Regression and Quality Gate

### Approach

Run a full validation sweep, fix only issues introduced by this change set, and finish with formatting.

### Red-Green-Refactor Loop

- **Red:** Run full suites and capture failures.
- **Green:** Apply minimal fixes scoped to changed files.
- **Refactor:** Final cleanup + formatting.

### Tasks

1. Run full unit tests.
2. Run full integration tests.
3. Run e2e tests focused on model selection flow and route-backed model loading.
4. Run lint and typecheck.
5. Fix regressions introduced by this work (avoid unrelated refactors).
6. Run Prettier on all modified files.
7. Re-run targeted tests for any files touched during fixes.
8. Produce a final acceptance checklist mapping to spec criteria.

---

## Planned Test Matrix

- **Unit:** neutral model-list cache utility behavior; any refactored route helpers.
- **Integration:** `/api/models` cache behavior (fresh, stale, refresh), security/error invariants preserved.
- **E2E:** model selector still loads/uses model list correctly with route caching active.
- **Static checks:** lint, typecheck, formatting.

---

## Acceptance Mapping

1. Remove detection/discovery/confirmation logic → Phases 3 and 4.
2. Remove capability cache logic → Phases 1 and 3.
3. Retain `/api/models` response caching as model-list caching → Phases 1 and 2.
4. Remove capability-only tests and keep relevant coverage → Phase 4.
5. Keep non-capability route behavior stable → Phases 2 and 6.
6. Remove stale capability runtime docs → Phase 5.

---

## Dependency-Ordered Execution Sequence

1. Phase 1: Neutral cache utility contract and tests
2. Phase 2: Route rewiring to neutral cache
3. Phase 3: Capability runtime removal
4. Phase 4: Test suite removal/migration
5. Phase 5: Documentation alignment
6. Phase 6: Full regression and final formatting

Each phase should be completed and validated before proceeding to the next.
