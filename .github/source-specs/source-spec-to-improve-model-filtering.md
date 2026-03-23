# Source Spec: Improve Model Filtering via Responses Capability Discovery

## Objective
Ensure the model dropdown contains only models that are verified as compatible with the OpenAI Responses API, preventing users from selecting unsupported models that fail at submit time.

## Context
The current model filtering logic is heuristic-based and can allow unsupported model families (for example, embeddings and image-generation models) into the dropdown. These models later fail with Responses API incompatibility errors (such as `invalid_request_error` / `model_not_found`).

## Scope
- Server-side model compatibility determination and filtering for `GET /api/models`.
- Capability discovery and verification workflow using OpenAI API interactions.
- Cache and override handling for compatibility status.
- Submit-time model validation to prevent stale or manipulated unsupported selections from being forwarded upstream.
- End-to-end dropdown behavior that depends on filtered model output.

## Non-Goals
- Replacing the existing dropdown UX with a new model browser.
- Building runtime scraping/documentation-based support detection.
- Changing OpenAI request semantics beyond compatibility checks.
- Persisting user model preferences across sessions (unless already implemented elsewhere).

## Functional Requirements

### 1. Capability Discovery and Verification
1. The server must discover candidate model IDs from `GET /v1/models`.
2. The server must verify candidate compatibility using a minimal `POST /v1/responses` probe strategy.
3. Probe classification must be deterministic:
   - Probe success => `supported`
   - Known incompatibility response => `unsupported`
   - Transient or indeterminate failures => `unknown`
4. Probe requests must use low-cost/minimal payloads suitable for capability checks.

### 2. Capability Contract
1. The system must represent compatibility status explicitly (at minimum: `supported`, `unsupported`, `unknown`).
2. Each capability record must track metadata required for lifecycle decisions (for example: timestamp and origin/source).
3. Capability resolution must use deterministic precedence:
   - Manual overrides
   - Fresh verified result
   - Stale cached result (subject to policy)
   - Unknown fallback
4. Empty or invalid model IDs must not be treated as supported.

### 3. Cache and Override Policy
1. Capability results must be cached with a configurable TTL.
2. Fresh cache entries should be reused without immediate re-probing.
3. Stale entries should trigger refresh behavior according to policy.
4. Manual deny overrides must exclude a model even if probe-based status is supported.
5. Manual allow overrides may include a model only when policy explicitly permits this behavior.

### 4. `/api/models` Filtering
1. `GET /api/models` must return only models resolved as `supported` after applying capability rules.
2. Known problematic examples such as `text-embedding-ada-002`, `gpt-image-1.5`, and `dall-e-3` must not appear in the dropdown feed.
3. The response schema consumed by the client must remain backward compatible.
4. If capability status is unknown and policy is fail-safe, unknown models must be excluded from the dropdown output.

### 5. Submit-Time Validation
1. Prompt submission must re-validate the selected model against the same capability contract used by `/api/models`.
2. Unsupported submitted model IDs must not be forwarded to OpenAI Responses API calls.
3. Missing, stale, or rejected selections must follow deterministic fallback behavior (for example, existing default-model policy).
4. Submit-path validation must be server-side and must not trust client state.

### 6. User Experience Outcomes
1. Users should only see supported models in the dropdown during normal flows.
2. Supported models should remain selectable and usable end-to-end.
3. The prior incompatibility failure should no longer occur from normal dropdown selection flows.
4. Existing loading, empty, and error UI states for model fetching should remain functional.

## Validation Rules
- Capability determination must be deterministic for the same input set and policy configuration.
- Unknown capability status must be handled via explicit policy, not implicit fallback.
- Model compatibility decisions must be centralized to prevent route-level drift.
- Any case handling/normalization for model IDs must be consistent across list and submit paths.

## Security and Reliability
- Do not expose sensitive request data or secrets in capability logs.
- Bound probe concurrency and timeout behavior to avoid resource exhaustion.
- Gracefully handle upstream rate limits and transient failures.
- Ensure override configuration is validated and safely parsed.

## Accessibility
- Filtering updates must not regress keyboard or assistive-technology behavior of the model selector.
- Existing label/help text and association semantics must remain intact.
- Error messaging for model-fetch failures must remain accessible and consistent with existing patterns.

## Testing Requirements

### Unit Tests
- Capability contract states and precedence logic.
- TTL freshness/staleness behavior.
- Probe result classification rules.
- Invalid/empty model ID handling.
- Submit validation decision rules for `supported`, `unsupported`, `unknown`, and missing model IDs.

### Integration Tests
- Discovery + probe pipeline behavior with mixed outcomes.
- Cache/override merge behavior and policy enforcement.
- `GET /api/models` returns supported-only results.
- Known unsupported examples are excluded.
- Submit path does not forward unsupported model IDs upstream.

### End-to-End Tests
- Dropdown renders only supported models from mixed upstream data.
- Known unsupported examples are absent from selectable options.
- Supported model selection succeeds through prompt submit flow.
- No-selection/default behavior remains correct.
- Regression guard for prior Responses incompatibility error in normal UI flow.

### Accessibility Tests
- Model selector remains keyboard operable after filtering changes.
- Existing accessibility checks for model-loading/error states remain green.

## Acceptance Criteria
1. Unsupported models are excluded from dropdown options produced by `/api/models`.
2. Supported models remain available and function correctly in end-to-end submit flows.
3. Server-side submit validation prevents unsupported models from being forwarded upstream.
4. Capability logic is centralized, deterministic, and maintainable via contract, cache, and override rules.
5. Unit, integration, E2E, and accessibility tests cover compatibility and regression scenarios.

## Out of Scope
- UI redesign of model selection components.
- Real-time model capability updates pushed directly from OpenAI without server orchestration.
- Non-model-related prompt submission changes.

## References
- `.github/implementation-plans-with-tasks/implementation-plan-with-tasks-to-improve-model-filtering.md`
- `.github/source-specs/previous-source-spec-to-improve-model-filtering.md`
- `server/api/models.get.ts`
- `server/utils/openai-model-support.ts`
- `server/utils/openai-model-validation.ts`

---
**Last updated:** March 11, 2026
