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
- Fail safe: unsupported models must not appear in the dropdown; `unknown` models may appear with a UI caveat.
- Keep implementation observable (structured logs/metrics at `info` level; metrics to stdout/stderr) without exposing sensitive details.
- Each phase must ship with tests first (red), then implementation (green), then cleanup (refactor).

## Resolved Design Decisions
- **Cache storage:** Capability state is persisted in **server memory**.
- **Cache TTL:** Fixed at **24 hours**; not environment-configurable.
- **Manual override config:** Allow/deny lists are loaded from `server/config/allowed-models-overrides.json` with schema `{ "allowed_models": string[], "disallowed_models": string[] }`.
- **Probe payload:** Hardcoded minimum-length input string and `max_output_tokens: 16`.
- **Probe concurrency:** Unbounded (all candidates probed in parallel).
- **Probe timeout:** 2 seconds per probe call; exceeded probes are classified as `unknown`.
- **Stale cache behavior:** Route returns stale data immediately, then triggers an async background refresh (stale-while-revalidate).
- **`unknown` capability in dropdown:** Included with `capabilityUnverified: true`, and the caveat is shown in `ModelsSelector.vue` text.
- **Unsupported model submitted:** Server returns a user-facing error; does not silently fall back to default model.
- **Logging level:** All discovery/probe/cache events logged at `info`; metrics written to stdout/stderr.

---

## Phase 1 — Define Capability Contract and Data Model

### Approach
Start by defining a clear domain contract for capability status so all later layers (models API, submit validation, UI) consume the same semantics. This avoids ad hoc booleans and makes cache, overrides, and probe outcomes consistent.

### Red-Green-Refactor Loop
- **Red:** Add unit tests for capability states and merge precedence (probe vs override vs unknown).
- **Green:** Implement minimal capability types/helpers to satisfy tests.
- **Refactor:** Simplify naming and remove ambiguous status flags.

### Tasks
1. Define capability statuses (`supported`, `unsupported`, `unknown`) and required metadata (`checkedAt`, `source`, optional `errorCode`).
2. Define fixed TTL constant of **24 hours**; document that this is not configurable.
3. Define precedence rules: manual overrides > fresh probe result > stale cached result > `unknown` fallback.
4. Add unit tests for capability status transitions and precedence logic.
5. Add unit tests for TTL expiration: a record is `fresh` when `checkedAt` is within 24 hours; `stale` otherwise.
6. Add unit tests for deterministic handling of missing model IDs and malformed in-memory cache records.
7. Add unit tests for parsing valid and malformed config files shaped as `{ "allowed_models": string[], "disallowed_models": string[] }`.
8. Implement capability contract utilities, including server-memory cache read/write helpers, to make tests pass.
9. Implement config-file loader for `server/config/allowed-models-overrides.json`.
10. Refactor utility names/types so they describe domain intent (capability/verification), not transport details.

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
2. Add unit tests for probe classification rules (`2xx` => `supported`, known `400` incompatibility error => `unsupported`, timeout or transient failure => `unknown`).
3. Add unit tests asserting that the probe request uses a hardcoded minimum-length input string and `max_output_tokens: 16`.
4. Add unit tests asserting that probe calls exceeding **2 seconds** are classified as `unknown` (not `supported` or `unsupported`).
5. Add integration test with mixed probe outcomes across model IDs and verify resulting capability map.
6. Add integration test for rate-limit or transient OpenAI failures to ensure graceful `unknown` classification without hard crashes.
7. Implement discovery + probe orchestration: all candidates probed in parallel (unbounded concurrency), each with a **2-second** timeout.
8. Refactor classifier/probe adapters into focused helpers for easier mocking.

---

## Phase 3 — Add Cache + Override Layer and Expose Filtered `/api/models`

### Approach
Integrate capability results with cache and overrides so `/api/models` can return a deterministic, filtered list without probing on every request. This phase converts the pipeline into production behavior and protects performance.

### Red-Green-Refactor Loop
- **Red:** Add integration tests that fail if unsupported/stale/unknown models leak into API output.
- **Green:** Implement cache reads/writes, TTL handling, and override application in route flow.
- **Refactor:** Clarify route variables (`upstream`, `capabilityMap`, `supportedModels`), isolate async background-refresh logic, and remove duplicate filters.

### Tasks
1. Add integration test: `/api/models` returns `supported` models and `unknown` models (with a caveat flag); excludes `unsupported` models.
2. Add integration test: known unsupported examples (`text-embedding-ada-002`, `gpt-image-1.5`, `dall-e-3`) are excluded from the response.
3. Add integration test: `unknown` models appear in the response with a caveat field (e.g., `"capabilityUnverified": true`) and are not silently dropped.
4. Add integration test: stale cache (older than 24 hours) returns stale data immediately and triggers an **async background** refresh without blocking the response.
5. Add integration test: fresh cache (within 24 hours) is reused without re-probing and no background refresh is triggered.
6. Add integration test: manual deny override excludes a model even if probe says `supported`.
7. Add integration test: manual allow override includes a model when policy permits explicit exceptions.
8. Implement server-memory cache store/retrieval with 24-hour TTL checks and async background-refresh trigger on stale read.
9. Implement override merge logic using `server/config/allowed-models-overrides.json`.
10. Update `GET /api/models` flow to consume capability pipeline and emit existing client schema, including `capabilityUnverified: true` for `unknown` models.
11. Update `ModelsSelector.vue` to show visible caveat text for models marked with `capabilityUnverified: true`.
12. Refactor route code to keep discovery/verification concerns outside response mapping.

---

## Phase 4 — Submit-Time Validation and Safe Fallback

### Approach
Even with filtered dropdown options, stale client state or direct request tampering can still submit unsupported models. Add submit-path validation to ensure the server never forwards incompatible models to `POST /v1/responses`.

### Red-Green-Refactor Loop
- **Red:** Add unit and integration tests for unsupported/stale submitted model IDs.
- **Green:** Implement deterministic submit validation and fallback behavior.
- **Refactor:** Centralize model-compatibility checks used by both list and submit paths.

### Tasks
1. Add unit tests for submit validation when selected model is `supported` (request proceeds normally).
2. Add unit tests for submit validation when selected model is `unsupported` (server returns a user-facing error; does not fall back to default model silently).
3. Add unit tests for submit validation when selected model is `unknown` (treat as unsupported; return user-facing error).
4. Add unit tests for submit validation when model is absent or null (server uses default model).
5. Add integration test: submit route returns a user-facing error for known unsupported model and does not forward it to OpenAI.
6. Add integration test: submit route uses default model correctly when selection is missing or null.
7. Implement submit-time compatibility check using the shared capability contract; unsupported/unknown selections return a structured error response.
8. Refactor to eliminate duplicated model validation logic across server routes/utilities.

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
3. Add E2E assertion: `unknown` models display the caveat text in `ModelsSelector.vue`.
4. Add E2E scenario: supported model remains selectable and successful on submit.
5. Add E2E scenario: no explicit selection still uses default-model behavior.
6. Add E2E regression scenario: normal dropdown flow does not produce prior Responses-incompatible model error.
7. Stabilize route mocks and timing controls for repeatable CI behavior.

---

## Phase 6 — Observability, Documentation, and Release Readiness

### Approach
Finalize maintainability and operational confidence: document how capability discovery works, how to update overrides, and what test evidence proves correctness.

### Red-Green-Refactor Loop
- **Red:** Add missing regression tests uncovered during observability/docs cleanup.
- **Green:** Complete docs/logging/telemetry additions while preserving behavior.
- **Refactor:** Simplify names and remove dead branches introduced during migration.

### Tasks
1. Add `info`-level structured logging for: model discovery start/complete, probe classification result per model, cache hit/miss per model, and override application.
2. Add stdout/stderr metric output for: total models discovered, total probed, counts per capability status, and cache hit rate.
3. Ensure no secrets or API keys appear in any log or metric output.
4. Add unit tests for any new logging/metric helper formatting if introduced.
5. Update docs to describe discovery/probe/cache/override model-filtering behavior, fixed 24-hour TTL, unbounded concurrency, 2-second probe timeout, override config file path/schema, and `unknown` caveat text behavior in `ModelsSelector.vue`.
6. Add maintainer guidance for updating override lists and interpreting probe errors.
7. Run full matrix: unit, integration, E2E, and accessibility checks.
8. Prepare final acceptance mapping from user bug reports to concrete passing tests.

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
