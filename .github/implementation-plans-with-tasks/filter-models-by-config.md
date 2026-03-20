# Implementation Plan with Tasks: Filter Models by Config

## Source of Requirements

- Spec file: `.github/specs/filter-models-by-config.md`
- Delivery style: Test-Driven Development (TDD) with Red-Green-Refactor loops
- Required test scope: unit, integration, and end-to-end tests

## Goal

Add config-driven filtering for the model dropdown using `server/config/models/openai-models.json`, while preserving safe fallback behavior, alphabetical ordering, existing `/api/models` security checks, and stable UI behavior.

### Desired End State

- The app still fetches the full model list from the OpenAI Models API.
- The server optionally filters that list using `server/config/models/openai-models.json` when the file is present and valid.
- Models listed in `models-with-error` and `models-with-no-response` are excluded from the dropdown when config is valid.
- `other-models` is parsed and validated but does not affect filtering behavior.
- When config is missing, unreadable, malformed, or schema-invalid, the app falls back to the full upstream list.
- The client receives deterministic metadata indicating whether fallback mode was used.
- The dropdown is alphabetically ordered in both config-valid and fallback modes.
- The fallback note is shown only in fallback mode, using the exact spec text.
- A sample config file exists at `server/config/models/openai-models.json.example`.

---

## Implementation Principles

- Keep `/api/models` as the single server-side source for dropdown data and fallback metadata.
- Preserve the existing base response contract (`object`, `data`) and extend it with explicit metadata fields.
- Fail open for config problems: invalid config must trigger fallback mode, not a fatal route error.
- Keep filtering logic pure and separately testable from file I/O.
- Keep cache semantics safe with respect to config changes: cache upstream model lists only, then apply config filtering and fallback metadata after cache read/fetch so a local config edit is reflected without waiting for cache expiry.
- Use explicit, domain-specific naming such as `models config`, `config filter`, and `fallback note`.
- Keep UI messaging accessible and deterministic.

---

## Proposed Design Decisions

### Response Metadata

Use explicit boolean metadata in `GET /api/models` responses:

- `usedConfigFilter`: `true` when a valid config was loaded and exclusion filtering was applied.
- `showFallbackNote`: `true` when config fallback mode was used.

This keeps the client logic simple and deterministic.

### Cache Boundary

Keep the existing in-memory cache focused on the upstream OpenAI models response, not on the config-filtered result. After cached or freshly fetched upstream models are available, the route should:

1. load and validate `openai-models.json`,
2. apply exclusions if valid,
3. sort the final dropdown list alphabetically,
4. attach metadata for client rendering.

This avoids stale filtering behavior when the local config file changes while cached upstream models are still fresh.

### Server Responsibilities

Split responsibilities into small units:

- config file path + loader
- schema validation / normalization
- filtering + alphabetical sorting helper
- `/api/models` response assembly

---

## Phase 1 — Define Config Contract and Pure Filtering Helpers (TDD)

### Approach

Start with pure logic that does not depend on file I/O or route wiring. This establishes a stable contract for valid config parsing, exclusion-set construction, and alphabetical sorting before touching runtime integration.

### Red-Green-Refactor Loop

- **Red:** Add failing unit tests for config schema validation and pure filtering behavior.
- **Green:** Implement config-shape validation and filtering helpers with the smallest logic needed to pass.
- **Refactor:** Consolidate duplicate setup, tighten helper names, and keep return types explicit.

### Tasks

1. Define a TypeScript type for the required config shape with keys:
   - `models-with-error`
   - `models-with-no-response`
   - `other-models`
2. Add unit tests for schema validation:
   - accepts a valid object with all three keys as string arrays
   - rejects non-object root values
   - rejects missing required keys
   - rejects non-array key values
   - rejects arrays containing non-string entries
3. Add unit tests for a pure filtering helper:
   - excludes IDs listed in `models-with-error`
   - excludes IDs listed in `models-with-no-response`
   - ignores `other-models` for filtering
   - preserves only upstream-returned models
   - sorts results alphabetically by `id`
4. Implement a pure config validator/parser that returns either:
   - validated config data, or
   - a fallback-mode result with a reason code/string
5. Implement a pure helper that builds the exclusion set from the validated config.
6. Implement a pure helper that filters and alphabetizes upstream models.
7. Refactor test fixtures/helpers so later route and UI tests can reuse the same representative model data.

### Phase Validation

- Run targeted unit tests for config validation and filtering helpers.
- Run typecheck for the new helper/types files.

---

## Phase 2 — Add Config Loader and Sample Config File (TDD)

### Approach

Once the pure contract is stable, add server-side file loading around it. Keep file-system behavior isolated so missing/unreadable/malformed config cleanly maps to fallback mode instead of throwing route-fatal errors.

### Red-Green-Refactor Loop

- **Red:** Add failing unit tests for loader behavior across file-system and JSON parsing scenarios.
- **Green:** Implement the loader with minimal I/O and validation plumbing.
- **Refactor:** Normalize fallback reason handling and centralize path resolution.

### Tasks

1. Add a unit-testable server utility for loading `server/config/models/openai-models.json`.
2. Add unit tests for loader behavior:
   - existing valid file returns validated config result
   - missing file returns fallback mode
   - unreadable file returns fallback mode
   - malformed JSON returns fallback mode
   - schema-invalid JSON returns fallback mode
3. Decide and document the loader result shape for callers, including:
   - `mode` or equivalent discriminator
   - validated config when successful
   - fallback reason when not successful
4. Implement file reading and JSON parsing for the required path.
5. Reuse the Phase 1 validator so schema rules are enforced in exactly one place.
6. Add `server/config/models/openai-models.json.example` with the exact sample content from the spec.
7. Refactor the loader to keep path resolution and parsing concerns separate for simpler testing.

### Phase Validation

- Run targeted unit tests for the loader utility.
- Verify the sample config file path and contents exactly match the spec.
- Run typecheck for the loader and related tests.

---

## Phase 3 — Integrate Config Filtering into `/api/models` Safely (TDD)

### Approach

Wire the validated loader and pure filtering logic into `server/api/models.get.ts` while preserving current security checks and response caching. The route should continue caching upstream model responses, then apply config filtering and metadata after cache read/fetch so config changes are not masked by the response cache.

### Red-Green-Refactor Loop

- **Red:** Add failing integration tests that exercise `/api/models` across valid-config and fallback scenarios.
- **Green:** Update the route to load config, filter/sort the final list, and return metadata.
- **Refactor:** Keep fetch/caching/filtering responsibilities clearly separated and remove duplication in route branches.

### Tasks

1. Add integration test coverage for valid-config mode:
   - excludes models listed in `models-with-error`
   - excludes models listed in `models-with-no-response`
   - ignores `other-models` for filtering
   - returns models sorted alphabetically
   - returns `usedConfigFilter: true`
   - returns `showFallbackNote: false`
2. Add integration test coverage for fallback mode:
   - missing config returns full upstream list
   - malformed/invalid config returns full upstream list
   - returned list is still alphabetical
   - returns `usedConfigFilter: false`
   - returns `showFallbackNote: true`
3. Add an integration test that cached upstream models still reflect updated config filtering behavior without requiring cache expiry.
4. Extend `types/models.ts` (or equivalent shared API types) to include the new response metadata.
5. Update `server/api/models.get.ts` to:
   - load the upstream models as it does today
   - load/validate config after upstream list retrieval
   - filter and alphabetize the final list
   - attach deterministic metadata fields
6. Preserve existing route behavior for:
   - runtime config validation
   - allowed-host validation
   - upstream error sanitization
   - upstream model caching
7. Refactor route internals so the final response assembly happens in one place regardless of cache-hit vs cache-miss path.

### Phase Validation

- Run targeted integration tests for `GET /api/models`.
- Run adjacent unit tests for loader/filter helpers.
- Run typecheck for route and shared types.

---

## Phase 4 — Wire Client Metadata and Fallback Note UI (TDD)

### Approach

After the API contract is stable, propagate the new metadata through the client state layer and into the model selector UI. Keep the note rendering explicit, exact-text, and accessible.

### Red-Green-Refactor Loop

- **Red:** Add failing component/composable tests for fallback-note visibility and client handling of new API metadata.
- **Green:** Update the client fetch state and UI rendering to consume the metadata.
- **Refactor:** Simplify prop names/state shape and keep the note logic isolated from error rendering.

### Tasks

1. Add unit tests for the models-state client logic to confirm `/api/models` metadata is captured and exposed to the UI.
2. Add unit/component tests for `ModelsSelector.vue` (or the relevant parent view) to verify:
   - fallback note is shown only when fallback mode is active
   - fallback note text matches the exact spec text: `Note: List of OpenAI models may include some older models that are no longer available.`
   - fallback note is hidden when config filtering is active
3. Decide where the fallback flag should live in client state so it is available without duplicating source-of-truth logic.
4. Update shared client-side response typing to include the new metadata fields.
5. Update `use-models-state.ts` to store the fallback/config-filter metadata returned by `/api/models`.
6. Update the relevant UI component(s) to render the fallback note conditionally.
7. Ensure the note is associated with the selector in an accessible way if it affects user understanding of the available options.
8. Refactor any duplicated prop plumbing or computed state introduced by the metadata.

### Phase Validation

- Run targeted unit/component tests for client state and selector rendering.
- Run existing accessibility-focused tests affected by the selector UI.
- Run typecheck for Vue components and composables.

---

## Phase 5 — End-to-End Behavior Verification (TDD)

### Approach

Verify the feature through the real browser flow once server and client pieces are wired. Cover both config-valid and fallback scenarios, focusing on what the user actually sees in the dropdown and note area.

### Red-Green-Refactor Loop

- **Red:** Add failing Playwright tests for both config-valid and fallback scenarios.
- **Green:** Make the browser flows pass using the already-implemented server/client behavior.
- **Refactor:** Remove brittle selectors and prefer semantic locators or stable test IDs where necessary.

### Tasks

1. Add an end-to-end test for valid-config mode that verifies:
   - excluded models do not appear in the dropdown
   - remaining models appear alphabetically
   - fallback note is not shown
2. Add an end-to-end test for fallback mode that verifies:
   - all upstream models appear in the dropdown
   - dropdown options are alphabetical
   - fallback note is shown with this exact text: `Note: List of OpenAI models may include some older models that are no longer available.`
3. Reuse or extend existing route mocking patterns so config-valid and fallback scenarios are deterministic.
4. Ensure selectors/assertions are resilient and do not depend on incidental DOM structure.
5. Refactor test helpers/fixtures if the new scenarios duplicate model-list setup.

### Phase Validation

- Run targeted Playwright tests for the new scenarios.
- Re-run nearby e2e tests that cover model loading/selection behavior.

---

## Phase 6 — Documentation and Final Regression (Refactor)

### Approach

Once behavior is green across test layers, update public documentation and perform the final regression sweep. Keep the docs aligned with the exact feature semantics and fix only issues introduced by this change.

### Red-Green-Refactor Loop

- **Red:** Identify stale or missing documentation for config path, fallback behavior, exact note text, and ordering.
- **Green:** Update docs and any necessary comments.
- **Refactor:** Normalize terminology so docs consistently describe config filtering and fallback mode.

### Tasks

1. Update `README.md` to describe:
   - the `server/config/models/openai-models.json` path
   - the `server/config/models/openai-models.json.example` sample file
   - config-valid filtering behavior
   - fallback behavior when config is missing/unreadable/invalid
   - the exact fallback note text: `Note: List of OpenAI models may include some older models that are no longer available.`
   - alphabetical ordering behavior
2. Update relevant code comments only where they help explain non-obvious config-filtering or fallback behavior.
3. Verify response metadata naming is documented if it is part of a shared app contract.
4. Run targeted tests first:
   - unit tests for config loader/filter helpers and UI note rendering
   - integration tests for `/api/models`
   - end-to-end tests for valid-config and fallback scenarios
5. Run broader project validation appropriate to the changed files.
6. Run formatting on modified files.
7. Review the final diff to ensure the implementation matches the spec and does not include out-of-scope behavior such as using `other-models` to alter dropdown contents.

### Phase Validation

- Unit, integration, and e2e tests relevant to the feature are green.
- Documentation is accurate and consistent with implemented behavior.
- Formatting and typecheck pass for modified files.

---

## Suggested Test Matrix

### Unit

- config schema validator
- config file loader fallback behavior
- exclusion-set builder
- filter-and-sort helper
- client metadata state handling
- fallback note UI visibility

### Integration

- `/api/models` valid config → filtered alphabetical list + metadata false/true as expected
- `/api/models` fallback config states → full alphabetical list + fallback metadata
- `/api/models` cached upstream response + changed local config → updated filtered output without cache expiry

### End-to-End

- valid config scenario
- fallback scenario
- nearby existing model-selector flow remains stable

---

## Risks and Watchpoints

- Caching the filtered response instead of the upstream response would make local config edits appear stale until cache expiry.
- Adding response metadata requires coordinated updates to shared types and client state handling.
- The exact fallback note text is part of the spec and should be asserted exactly.
- Alphabetical sorting must apply in both config-valid and fallback modes, not only after filtering.
- `other-models` must be validated but must not affect filtering behavior in this feature.

---

## Out-of-Scope Guardrails

Do not include work for:

- generating `openai-models.json` automatically
- using `other-models` to change dropdown behavior
- submit-time blocking based on config categories
- notification or reporting workflows tied to config contents
