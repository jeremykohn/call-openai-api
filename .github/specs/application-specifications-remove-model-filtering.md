# Application Specification: Remove Model Filtering and Capability Verification

## Overview

This specification defines the changes required to:

1. Remove filtering of models in the dropdown.
2. Remove verification of each model's capability.

After implementation, the model dropdown must include all models returned by the OpenAI Models API.

## Objective

- Return an unfiltered model list from `GET /api/models`.
- Eliminate per-model capability verification/probing from the model-listing flow.
- Eliminate model rejection logic based on capability verification metadata.
- Preserve existing security validation for OpenAI configuration and host allow-list checks.

---

## Current Behavior (To Be Changed)

The current `server/api/models.get.ts` pipeline:

- Fetches models from OpenAI.
- Performs capability discovery/probing.
- Applies capability resolution and override logic.
- Excludes models marked unsupported and marks some as `capabilityUnverified`.

The current UI/validation behavior:

- Dropdown only receives models after filtering.
- UI may show an unverified-availability caveat.
- Submit validation may reject selected models due to capability-unverified metadata.

---

## Target Behavior

After this change:

1. `GET /api/models` returns all upstream models from OpenAI `data` without capability filtering.
2. No per-model capability verification is executed to decide dropdown inclusion.
3. Dropdown displays every model returned by `/api/models`.
4. Submit-time model validation checks only model presence in the fetched list, not capability verification metadata.
5. Existing OpenAI security checks remain unchanged.

---

## Functional Requirements

### 1) Server Route: Unfiltered Model Passthrough (`server/api/models.get.ts`)

- Keep endpoint and response contract unchanged:
  - `{ object: "list", data: OpenAIModel[] }`
- Build response data directly from OpenAI models payload.
- Remove inclusion/exclusion decisions based on capability status.
- Keep existing error handling and response sanitization behavior.
- Keep existing runtime config validation and host restrictions.

### 2) Remove Capability Verification in Model Listing

- Do not run per-model capability verification (probe/discovery) when serving `/api/models`.
- Do not use capability overrides (`allowed_models` / `disallowed_models`) to decide whether a model appears in dropdown data.
- Do not annotate returned models with capability verification markers (for example, `capabilityUnverified`).

### 3) Dropdown Behavior (`app/components/ModelsSelector.vue`)

- Render all models from `models` prop.
- Remove capability-verification caveat UX and related ARIA references if no longer applicable.
- Preserve accessible labels, required semantics, error message associations, and keyboard operability.

### 4) Submit Validation (`server/utils/openai-model-validation.ts`)

- Keep model existence validation (selected model must exist in model list).
- Remove capability-verification-based rejection.
- Reject only for:
  - missing/empty selected model (existing behavior)
  - selected model absent from list
  - inability to fetch model list

### 5) Type Contract (`types/models.ts`)

- Remove `capabilityUnverified` from `OpenAIModel` if no longer used.
- Keep model typing aligned with OpenAI Models API payload used by this app.

---

## Cleanup Requirements (Code-Level)

If they become unused after implementation, remove imports/usages tied to capability verification from `/api/models` flow, including:

- `discoverModelCandidates`
- `probeModelCapabilities`
- `resolveModelCapability`
- `loadAllowedModelsOverrides`
- capability-summary/metrics calls used only for verification filtering decisions

Note: keep security-related utilities and cache primitives that still provide value for unfiltered model retrieval.

---

## Non-Functional Requirements

- No secrets exposed in client code or logs.
- Maintain existing SSR/server security guardrails.
- Improve or maintain latency for `/api/models` by removing per-model verification calls.
- Keep response payload deterministic and stable.

---

## Out of Scope

- Changing OpenAI API endpoints.
- Guaranteeing that every listed model supports the specific prompt/use case.
- Introducing new client-side model categorization/filtering UI.

---

## Acceptance Criteria

1. `/api/models` includes all upstream models from OpenAI response payload.
2. No model is removed from `/api/models` due to capability probe result or override list.
3. No per-model capability verification runs as part of serving `/api/models`.
4. Dropdown displays all models returned by `/api/models`.
5. Submit validation does not reject a listed model due to capability verification metadata.
6. Existing OpenAI config/host security checks still pass and are unchanged in behavior.

---

## Test Plan

### Unit Tests

- `server/api/models.get.ts`
  - Returns full mapped upstream list.
  - Contains no capability-based inclusion filtering assertions.
- `app/components/ModelsSelector.vue`
  - Renders all provided model IDs.
  - Does not render capability-verification caveat text.
- `server/utils/openai-model-validation.ts`
  - Accepts any listed model regardless of former capability metadata.
  - Rejects only missing/nonexistent/fetch-failure scenarios.

### Integration Tests

- Mock OpenAI models response with diverse model families:
  - Assert complete passthrough from `/api/models`.
- Submit flow with a model present in `/api/models`:
  - Assert no capability-verification rejection path.

### E2E Tests

- On app load, dropdown includes all mocked `/api/models` entries.
- Error handling for models fetch failures remains unchanged and accessible.

---

## Rollout Notes

- Users may now see models that can fail at response generation time due to upstream model constraints.
- Preserve clear submit-time error messages so failures remain understandable.
