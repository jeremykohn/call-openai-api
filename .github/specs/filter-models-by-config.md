# Application Specification: Filter Models by Config

## Overview
This specification defines a config-driven filtering feature for the model dropdown in the Nuxt app.

The app should continue to retrieve the full model list from the OpenAI Models API, then optionally filter that list using a local config file named `openai-models.json`.

## Objective
- Use config-driven exclusions for models that should not appear in the UI dropdown.
- Preserve a safe fallback behavior when config is missing/unreadable/invalid.
- Provide a sample config file named `openai-models.json.example`.

---

## File Naming and Replacement Rules

### New Config File
- **File name:** `openai-models.json`
- **Path:** `server/config/models/openai-models.json`

### Sample Config File
- **File name:** `openai-models.json.example`
- **Path:** `server/config/models/openai-models.json.example`

---

## Feature Behavior

### Source of Models
In all cases, the app should retrieve models from the OpenAI Models API first.

### Config-Driven Filtering (when config is valid)
If `server/config/models/openai-models.json`:
- exists,
- can be read,
- can be parsed as JSON,
- and matches the required format,

then the dropdown should include:
- all models returned by the OpenAI Models API,
- except models listed in:
  - `models-with-error`, and
  - `models-with-no-response`.

The UI should **not** show the fallback note in this mode.

### Fallback Behavior (when config missing/unreadable/invalid)
If `server/config/models/openai-models.json`:
- does not exist, or
- cannot be read, or
- cannot be parsed, or
- has invalid format,

then the dropdown should include:
- all models returned by the OpenAI Models API,
- with no config-based exclusions,
- and the UI should show this exact message:

`Note: List of OpenAI models may include some older models that are no longer available.`

### Ordering Rule (applies in all cases)
In any mode, the final dropdown model list should be sorted alphabetically by model name.

---

## Required Config Format
The config file must be a JSON object with these keys:
- `models-with-error`
- `models-with-no-response`
- `other-models`

Each key must map to an array of strings.

```json
{
  "models-with-error": [
    "<model-name-1>",
    "<model-name-2>"
  ],
  "models-with-no-response": [
    "<model-name-3>",
    "<model-name-4>"
  ],
  "other-models": [
    "<model-name-5>",
    "<model-name-6>"
  ]
}
```

### Validation Rules
A config file is valid only if:
- the root value is an object,
- all required keys exist,
- each required key is an array,
- and every array entry is a string.

Invalid config should trigger fallback mode, not a fatal app crash.

---

## Sample Config File Requirement
A sample config file must be added at `server/config/models/openai-models.json.example` with this content:

```json
{
  "models-with-error": [
    "babbage-002",
    "chatgpt-image-latest"
  ],
  "models-with-no-response": [
    "gpt-3.5-turbo-instruct"
  ],
  "other-models": [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-5.4"
  ]
}
```

---

## Functional Requirements

### 1) Server-Side Config Loader
Implement a server-side loader for `server/config/models/openai-models.json` that:
- reads file content,
- parses JSON,
- validates schema,
- and returns either:
  - usable config arrays, or
  - fallback mode signal with reason.

### 2) Model Filtering Logic
After fetching the OpenAI models list:
- build an exclusion set from:
  - `models-with-error`,
  - `models-with-no-response`.
- exclude matching model IDs from the dropdown list.
- ignore `other-models` for filtering behavior in this feature (it is informational metadata).

### 3) Fallback Flag for UI
The `/api/models` route should provide a deterministic way for the client to know when fallback mode was used (for rendering the note).

Acceptable approaches:
- explicit boolean field in response (recommended), or
- equivalent metadata field with clear semantics.

### 4) UI Rendering
The model selector UI must:
- render the provided list in alphabetical order,
- show the fallback note only when fallback mode is active,
- hide the fallback note in config-valid mode.

---

## API Contract Guidance (`GET /api/models`)
Keep existing base contract (`object`, `data`) and add mode metadata if needed.

Recommended response shape:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4.1",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    }
  ],
  "usedConfigFilter": true,
  "showFallbackNote": false
}
```

Any equivalent field names are acceptable if behavior is deterministic and documented.

---

## Documentation Requirements
Update `README.md` and any relevant code comments to describe:
- new config file path/name,
- fallback behavior,
- exact fallback message,
- alphabetical ordering behavior,

---

## Out of Scope
This spec does not require:
- auto-generating `openai-models.json`,
- using `other-models` to alter dropdown behavior,
- auto-notifications (email/issues),
- submit-time blocking rules based on config categories.

---

## Acceptance Criteria
1. The app uses `server/config/models/openai-models.json` for dropdown filtering when valid.
2. In config-valid mode, models listed under `models-with-error` and `models-with-no-response` are excluded from dropdown.
3. In fallback mode, all OpenAI models are shown and the exact fallback note is displayed.
4. Dropdown model names are alphabetical in both config-valid and fallback modes.
5. The sample file `server/config/models/openai-models.json.example` exists with the required sample content.
6. Tests verify valid-config filtering, invalid-config fallback, fallback-note visibility, and ordering.

---

## Test Plan

### Unit Tests
- Config loader:
  - valid schema accepted,
  - missing file triggers fallback,
  - malformed JSON triggers fallback,
  - wrong key/value types trigger fallback.
- Filter helper:
  - excludes models in `models-with-error` and `models-with-no-response`,
  - ignores `other-models` for exclusion,
  - applies alphabetical sorting.
- UI component:
  - fallback note visible when fallback flag is true,
  - fallback note hidden when false.

### Integration Tests
- `/api/models` with valid config:
  - excludes configured error/no-response models,
  - returns alphabetical list,
  - sets fallback metadata to false.
- `/api/models` with missing/invalid config:
  - returns full alphabetical list,
  - sets fallback metadata to true.

### End-to-End Tests
- Valid config scenario:
  - dropdown excludes configured blocked models,
  - list appears alphabetically,
  - fallback note not shown.
- Fallback scenario:
  - dropdown shows full list alphabetically,
  - fallback note shown exactly as specified.
