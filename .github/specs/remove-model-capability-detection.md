# Application Specification: Remove Model Capability Detection

## Overview

This specification removes all capability-detection behavior from the application, including capability discovery, capability probing/confirmation, and capability caching.

The goal is to simplify model handling so the app no longer classifies models as supported/unsupported/unknown based on probe logic or cached capability records.

## Objective

- Remove functionality that detects, discovers, or confirms model capability.
- Remove functionality that caches model capability records.
- Remove tests that only verify removed capability-detection behavior.
- Keep `/api/models` behavior stable for non-capability concerns (security validation, upstream fetch, and existing model-list response shape).

---

## Current Capability Components (To Remove)

### Capability core

- `server/utils/model-capability.ts`
  - Capability types (`ModelCapabilityStatus`, `ModelCapabilityRecord`)
  - Capability cache (`capabilityCache`, `setCapabilityRecord`, `getCapabilityRecord`, etc.)
  - Capability resolution (`resolveModelCapability`)
  - Shared capability TTL constant (`CAPABILITY_CACHE_TTL_MS`)

### Capability discovery/probing

- `server/utils/model-capability-discovery.ts`
  - `discoverModelCandidates`
  - `probeModelCapability`
  - `probeModelCapabilities`
  - probe classification/timeout constants and logic

### Capability overrides

- `server/utils/model-capability-overrides.ts`
  - legacy `allowed-models-overrides.json` parsing/loading for capability decisions

### Capability observability

- `server/utils/model-capability-observability.ts`
  - capability summary/metrics logging helpers

### Capability-related cache module

- `server/utils/model-capability-models-cache.ts`
  - currently used by `/api/models` response caching
  - currently coupled to capability constant (`CAPABILITY_CACHE_TTL_MS`)

---

## Functional Requirements

### 1) Remove capability detection pipeline

The codebase must not perform any model capability detection or confirmation at runtime.

Required outcomes:

- No calls to capability discovery/probe functions remain.
- No capability resolution calls remain.
- No model capability status classification remains in app logic.

### 2) Remove capability caching

The codebase must not cache capability records for models.

Required outcomes:

- Remove capability cache map and related APIs.
- Remove persistence or retrieval of capability records.
- Remove any response fields or internal state derived from capability cache.

### 3) Decouple model-list cache from capability (if model-list cache is retained)

If `/api/models` response caching is still needed, it must be implemented as model-list caching, not capability caching.

Required outcomes:

- `server/api/models.get.ts` must not import capability modules.
- Any retained model-list cache must no longer depend on `CAPABILITY_CACHE_TTL_MS` from capability code.
- Introduce a cache TTL constant local to model-list caching code (or route-level config), with clear naming unrelated to capability.

### 4) Remove capability-specific config dependency

Capability-related override config behavior must be removed.

Required outcomes:

- Remove runtime usage of `server/config/allowed-models-overrides.json` in capability paths.
- Remove capability override loader/parser usage.
- Ensure no fallback logic references capability overrides.

### 5) Preserve non-capability behavior

The following behavior must remain intact:

- OpenAI API key/config validation.
- OpenAI allowed-host validation.
- Secure upstream model fetch and error handling.
- Existing `/api/models` response contract used by client (`object`, `data`).

---

## File-Level Change Guidance

### Remove capability implementation files

Delete these files if they become unused:

- `server/utils/model-capability.ts`
- `server/utils/model-capability-discovery.ts`
- `server/utils/model-capability-overrides.ts`
- `server/utils/model-capability-observability.ts`

### Refactor/rename capability-labeled models cache file

For `server/utils/model-capability-models-cache.ts`, choose one:

- **Preferred:** rename/migrate to a neutral name (for example `server/utils/models-response-cache.ts`) and remove capability coupling.
- **Acceptable alternative:** keep file path temporarily but remove capability imports/types/constants and update code/comments to model-list cache semantics.

### Remove dead references

Remove imports/usages across route/util/test files that reference:

- `resolveModelCapability`
- `probeModelCapabilities`
- `probeModelCapability`
- `discoverModelCandidates`
- `CAPABILITY_CACHE_TTL_MS`
- `AllowedModelsOverrides`

---

## Test Changes

### Tests to remove (if only validating removed functionality)

Remove these tests when their targets are deleted:

- `tests/integration/model-capability-discovery.test.ts`
- `tests/unit/model-capability.test.ts`
- `tests/unit/model-capability-discovery.test.ts`
- `tests/unit/model-capability-overrides.test.ts`
- `tests/unit/model-capability-observability.test.ts`

### Tests to update

Update tests that currently depend on capability constants/modules purely for cache TTL or naming:

- `tests/unit/model-capability-models-cache.test.ts`
  - migrate assertions/imports to the non-capability model-list cache module/constants.
- Any `/api/models` route tests that still reference capability flags/fields/imports.

### Regression expectations

After changes:

- No tests should assert capability statuses (`supported`/`unsupported`/`unknown`) for model filtering.
- No tests should require capability cache semantics.
- `/api/models` tests should continue verifying route security/error behavior and stable response shape.

---

## Documentation Requirements

Update docs to remove or correct capability references:

- `README.md` and any spec/plan docs that describe capability detection, capability verification, or capability cache behavior as active runtime behavior.
- Ensure docs clearly state that the app does not perform runtime capability probing/detection.

---

## Out of Scope

This specification does not require:

- Reintroducing any model filtering rules.
- Changing the client-visible model object shape beyond capability-related removals already in progress.
- Changing unrelated API routes or UI behavior outside capability concerns.

---

## Acceptance Criteria

1. No runtime capability detection/discovery/confirmation logic remains in production code.
2. No capability cache logic remains in production code.
3. `/api/models` route has no imports from removed capability modules.
4. If model-list caching remains, it is decoupled from capability naming/constants and still works.
5. Capability-only tests are removed; remaining tests pass after refactors.
6. Documentation no longer describes capability detection/caching as active functionality.

---

## Validation Checklist

- Search for `model-capability` references in production code returns no capability-runtime dependencies.
- Search for `resolveModelCapability`, `probeModelCapabilities`, and `CAPABILITY_CACHE_TTL_MS` returns no active usage in runtime code.
- Test suite passes for updated scope.
- Lint/typecheck pass for modified files.
