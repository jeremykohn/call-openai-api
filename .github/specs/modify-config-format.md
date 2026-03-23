# Application Specification: Modify OpenAI Models Config Format

## Overview
This specification defines a schema update for `OpenAIModelsConfig` and the JSON config files used by model filtering.

The current config format includes:
- `models-with-error`
- `models-with-no-response`
- `other-models`

This change adds:
- `available-models`

and keeps existing filtering behavior unchanged.

## Objective
- Extend `OpenAIModelsConfig` with `available-models` (array of strings).
- Ensure config object keys are sorted alphabetically in canonical file output.
- Preserve dropdown filtering behavior: only exclude models listed in `models-with-error` and `models-with-no-response`.
- Update existing config files to the new format.

---

## File Scope
Use JSON files (not Markdown) for config.

### Active Config File
- **File name:** `openai-models.json`
- **Path:** `server/assets/models/openai-models.json`

### Sample Config File
- **File name:** `openai-models.json.example`
- **Path:** `server/assets/models/openai-models.json.example`

---

## Required Config Schema (New)
The config file root must be a JSON object with exactly these required keys:
- `available-models`
- `models-with-error`
- `models-with-no-response`
- `other-models`

Each key must map to an array of strings.

### Canonical Key Order
When writing or rewriting config JSON, keys must be serialized alphabetically in this order:
1. `available-models`
2. `models-with-error`
3. `models-with-no-response`
4. `other-models`

### Canonical Example
```json
{
  "available-models": [
    "gpt-4.1",
    "gpt-4.1-mini"
  ],
  "models-with-error": [
    "babbage-002"
  ],
  "models-with-no-response": [
    "gpt-3.5-turbo-instruct"
  ],
  "other-models": []
}
```

---

## Behavioral Requirements

### 1) Filtering Behavior (Unchanged)
Filtering logic for the UI dropdown remains unchanged:
- Exclude models listed in `models-with-error`.
- Exclude models listed in `models-with-no-response`.
- Do **not** exclude models based on `available-models`.
- Do **not** exclude models based on `other-models`.

### 2) Set-Like Semantics
For all four arrays:
- Treat values as unique model IDs in behavior.
- No duplicate entries should be written in canonical output.

### 3) Backward Compatibility / Migration
If existing config data is still in the old 3-key shape:
- Migration or rewrite must add `available-models` as an empty array when no success data exists.
- The resulting file must conform to the new 4-key schema and alphabetical key order.

---

## Validation Rules
A config is valid only if:
- root is a JSON object,
- all four required keys are present,
- each required key is an array,
- each entry in each array is a string.

Invalid config handling should keep existing safe fallback behavior (no crash).

---

## File Update Requirements
Update both files to the new schema:
- `server/assets/models/openai-models.json`
- `server/assets/models/openai-models.json.example`

Minimum required updates:
- Add `available-models` key.
- Preserve existing data in other keys.
- Ensure keys are alphabetically ordered.

---

## API and UI Contract Expectations
No UI contract change is required for this schema update beyond preserving current behavior:
- Exclusion behavior remains tied to `models-with-error` and `models-with-no-response`.
- Existing fallback note behavior remains unchanged.

---

## Out of Scope
This spec does not require:
- changing dropdown exclusion criteria to use `available-models`,
- introducing new UI labels for `available-models`,
- changing fallback note text,
- changing route names or endpoint shapes unrelated to config schema.

---

## Acceptance Criteria
1. `OpenAIModelsConfig` includes `available-models: string[]`.
2. Config validation requires all four keys.
3. Config write/update logic outputs keys in alphabetical order.
4. Dropdown filtering still excludes only models in `models-with-error` and `models-with-no-response`.
5. `server/assets/models/openai-models.json` and `.example` are updated to the new schema.
6. Existing fallback safety behavior remains intact for invalid/missing config.

---

## Suggested Test Coverage

### Unit
- Schema parser accepts valid 4-key config.
- Schema parser rejects missing `available-models`.
- Schema parser rejects non-array/non-string entries.
- Canonical writer outputs alphabetical key order.

### Integration
- `/api/models` filtering still excludes only error/no-response categories.
- Updated config files load correctly from `server/assets/models`.
- Invalid config still triggers fallback mode safely.

### End-to-End
- Dropdown does not display models listed under error/no-response categories.
- No regression in fallback note behavior.
