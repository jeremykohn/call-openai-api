# Implementation Plan with Tasks: Improve Model Filtering via Responses Capability Discovery

## Source Inputs
- Prompt file: `.github/prompts/prompt-to-create-implementation-with-tasks-to-improve-model-filtering.md`
- Follow-up requirement: design a practical capability-discovery strategy using OpenAI API data + verification probes
- Implementation style: Test-Driven Development (TDD) with explicit red-green-refactor loops
- Test scope required: unit, integration, and end-to-end tests

## Problem Statement
The current model filter relies on static heuristics that are not strict enough. Unsupported models (for example, embeddings and image-generation families) can still appear in the dropdown and then fail at submit time with `invalid_request_error` / `model_not_found` for the Responses API.

## Target Outcome
The dropdown should only show models that are verified as Responses-compatible. Compatibility should be determined by a server-owned capability pipeline:
1. Discover candidates from `GET /v1/models`
2. Verify candidates using a minimal `POST /v1/responses` probe
3. Cache capability results with TTL
4. Apply manual allow/deny overrides
5. Return only supported models from `/api/models`
6. Re-validate selected model at submit time

## Implementation Principles
- Keep the server as source of truth for model compatibility.
- Prefer deterministic behavior over runtime uncertainty.
- Separate discovery, verification, caching, and UI mapping concerns.
- Fail safe: unsupported or unknown capability should not appear in the dropdown.
- Keep implementation observable (structured logs/metrics) without exposing sensitive details.
- Each phase must ship with tests first (red), then implementation (green), then cleanup (refactor).

---

## Phase 1 — Define Capability Contract and Data Model

### Approach
Start by defining a clear domain contract for capability status so all later layers (models API, submit validation, UI) consume the same semantics. This avoids ad hoc booleans and makes cache, overrides, and probe outcomes consistent.

### Red-Green-Refactor Loop
- **Red:** Add unit tests for capability states and merge precedence (probe vs override vs unknown).
- **Green:** Implement minimal capability types/helpers to satisfy tests.
- **Refactor:** Simplify naming and remove ambiguous status flags.

### Tasks
1. Define capability statuses (for example: `supported`, `unsupported`, `unknown`) and required metadata (`checkedAt`, `source`, optional `errorCode`).
2. Define precedence rules: manual overrides > fresh probe result > stale cache > unknown fallback.
3. Add unit tests for capability status transitions and precedence logic.
4. Add unit tests for TTL expiration behavior (`fresh` vs `stale`).
5. Add unit tests for deterministic handling of missing model IDs and malformed cache records.
6. Implement the minimal capability contract utilities to make tests pass.
7. Refactor utility names/types so they describe domain intent (capability/verification), not transport details.

---

## Phase 2 — Implement Discovery + Probe Verification Pipeline

### Approach
Build the capability discovery engine on the server: fetch model candidates from OpenAI, probe candidates with lightweight Responses calls, classify results, and persist in cache. Keep this pipeline independent of route rendering so it can be tested in isolation.

### Red-Green-Refactor Loop
- **Red:** Add unit and integration tests that simulate list/probe outcomes and expected classification.
- **Green:** Implement the minimal discovery + probe + classifier flow.
- **Refactor:** Extract transport adapters and reduce duplicated classification branches.

### Tasks
1. Add unit tests for candidate discovery parsing from `GET /v1/models` payloads.
2. Add unit tests for probe classification rules (`2xx` => supported, known `400` incompatibility => unsupported, transient failures => unknown).
3. Add unit tests ensuring probe requests use minimal safe payload for low cost/latency.
4. Add integration test with mixed probe outcomes across model IDs and verify resulting capability map.
5. Add integration test for rate-limit or transient OpenAI failures to ensure graceful `unknown` classification without hard crashes.
6. Implement discovery + probe orchestration with bounded concurrency and timeout controls.
7. Refactor classifier/probe adapters into focused helpers for easier mocking.

---

## Phase 3 — Add Cache + Override Layer and Expose Filtered `/api/models`

### Approach
Integrate capability results with cache and overrides so `/api/models` can return a deterministic, filtered list without probing on every request. This phase converts the pipeline into production behavior and protects performance.

### Red-Green-Refactor Loop
- **Red:** Add integration tests that fail if unsupported/stale/unknown models leak into API output.
- **Green:** Implement cache reads/writes, TTL handling, and override application in route flow.
- **Refactor:** Clarify route variables (`upstream`, `capabilityMap`, `supportedModels`) and remove duplicate filters.

### Tasks
1. Add integration test: `/api/models` returns only capability-`supported` models.
2. Add integration test: known unsupported examples (`text-embedding-ada-002`, `gpt-image-1.5`, `dall-e-3`) are excluded.
3. Add integration test: stale cache triggers refresh path; fresh cache avoids re-probe path.
4. Add integration test: manual deny override excludes a model even if probe says supported.
5. Add integration test: manual allow override includes a model if policy permits explicit exceptions.
6. Implement cache store/retrieval, TTL checks, and override merge logic.
7. Update `GET /api/models` flow to consume capability pipeline and emit existing client schema.
8. Refactor route code to keep discovery/verification concerns outside response mapping.

---

## Phase 4 — Submit-Time Validation and Safe Fallback

### Approach
Even with filtered dropdown options, stale client state or direct request tampering can still submit unsupported models. Add submit-path validation to ensure the server never forwards incompatible models to `POST /v1/responses`.

### Red-Green-Refactor Loop
- **Red:** Add unit and integration tests for unsupported/stale submitted model IDs.
- **Green:** Implement deterministic submit validation and fallback behavior.
- **Refactor:** Centralize model-compatibility checks used by both list and submit paths.

### Tasks
1. Add unit tests for submit validation when selected model is `supported`.
2. Add unit tests for submit validation when selected model is `unsupported`.
3. Add unit tests for submit validation when selected model is `unknown` or absent.
4. Add integration test: submit route does not forward known unsupported model to OpenAI.
5. Add integration test: default-model fallback remains correct when selection is missing or rejected.
6. Implement submit-time compatibility check using the shared capability contract.
7. Refactor to eliminate duplicated model validation logic across server routes/utilities.

---

## Phase 5 — End-to-End UX Validation and Regression Safety

### Approach
Validate complete browser flows with deterministic mocks to prove users only see supported models and no longer hit the prior model-not-supported error from normal dropdown usage.

### Red-Green-Refactor Loop
- **Red:** Add failing E2E scenarios for mixed model lists and unsupported selections.
- **Green:** Implement any remaining wiring/state fixes so all scenarios pass.
- **Refactor:** Stabilize selectors/mocks/waits to prevent flaky regressions.

### Tasks
1. Add E2E scenario: mixed upstream model list appears in UI as supported-only dropdown options.
2. Add E2E assertion: unsupported examples from bug report are absent from dropdown options.
3. Add E2E scenario: supported model remains selectable and successful on submit.
4. Add E2E scenario: no explicit selection still uses default-model behavior.
5. Add E2E regression scenario: normal dropdown flow does not produce prior Responses-incompatible model error.
6. Stabilize route mocks and timing controls for repeatable CI behavior.

---

## Phase 6 — Observability, Documentation, and Release Readiness

### Approach
Finalize maintainability and operational confidence: document how capability discovery works, how to update overrides, and what test evidence proves correctness.

### Red-Green-Refactor Loop
- **Red:** Add missing regression tests uncovered during observability/docs cleanup.
- **Green:** Complete docs/logging/telemetry additions while preserving behavior.
- **Refactor:** Simplify names and remove dead branches introduced during migration.

### Tasks
1. Add structured logging around discovery, probe classification, cache hit/miss, and override application (without secrets).
2. Add unit tests for any new telemetry helper formatting if introduced.
3. Update docs to describe discovery/probe/cache/override model-filtering behavior and operational knobs (TTL, concurrency, timeouts).
4. Add maintainer guidance for updating override lists and interpreting unsupported probe errors.
5. Run full matrix: unit, integration, E2E, and accessibility checks.
6. Prepare final acceptance mapping from user bug reports to concrete passing tests.

---

## Test Matrix (Planned)
- **Unit tests:** capability contract, precedence, TTL behavior, probe classification, submit validation.
- **Integration tests:** discovery/probe pipeline, cache + overrides, `/api/models` filtering, submit-path guardrails.
- **E2E tests:** supported-only dropdown rendering and regression prevention for unsupported-model submit failures.
- **Accessibility tests:** ensure model selector behavior remains keyboard/screen-reader compatible after filtering changes.

## Acceptance Criteria Mapping
1. **Unsupported models are not shown in dropdown:** validated by Phase 3 integration tests + Phase 5 E2E visibility assertions.
2. **Supported models continue to work end-to-end:** validated by Phase 2 probe classification + Phase 5 submit-success scenarios.
3. **Server never blindly forwards unsupported models from stale/tampered input:** validated by Phase 4 integration tests.
4. **Filtering remains maintainable and operationally observable:** validated by Phase 1 contract tests + Phase 6 docs/telemetry checks.

## Delivery Sequence Recommendation
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6

Each phase should be merged only after its red-green-refactor loop is complete and the relevant subset of tests is green.
