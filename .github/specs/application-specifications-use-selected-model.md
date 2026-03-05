# Feature Specification: Use Selected Model on Prompt Submission

## Summary
When a user submits a prompt, the app must send the currently selected model from the dropdown to the server so that the OpenAI Responses API uses that model to generate the response.

## Goals
- Ensure the selected model is included in prompt submission requests.
- Use the selected model on the server when calling the OpenAI Responses API.
- Keep UI responsive with clear loading and error states.

## Non-Goals
- Adding new model management UX beyond the existing dropdown.
- Persisting model choice across sessions (localStorage) unless already present.
- Changing OpenAI API provider or endpoint behavior beyond passing the model.

## User Experience
- The model dropdown remains the source of truth for model selection.
- Submitting the prompt uses the selected model without additional user action.
- If no model is selected, the app uses the default model (for example, "gpt-4.1-mini") and displays help text.
- The help text is: "Uses the default model ", plus the name of the default model, plus " if no model is selected."
- No error is shown for missing selection; the prompt is submitted as normal.

## Functional Requirements
1. The client should include `model` in the request body when submitting a prompt if a model is selected; otherwise, omit `model` and allow the server to use the default.
2. The server must validate `model` against the allowed model list if provided, or use the default model if not.
3. The server must pass the selected or default model through to the OpenAI Responses API request.
4. If the provided model is invalid, the server returns a helpful error; if no model is provided, the server uses the default model without error.

## Data Contract
### Client → Server (`POST /api/respond`)
```json
{
  "prompt": "string",
  "model": "string"
}
```

### Server → Client (success)
```json
{
  "text": "string",
  "model": "string"
}
```

### Server → Client (error)
```json
{
  "message": "string",
  "details": "string (optional)"
}
```

## Validation Rules
- `prompt` is required and must not exceed the configured maximum length.
- If `model` is provided, it must match one of the models returned by `/api/models`.
- If `model` is missing, empty, or null, the server uses the default model.
- Reject unknown `model` values with a 400 status.

## Accessibility
- The model select element uses `aria-describedby` and `aria-invalid` for error states, but no error is shown for missing selection.
- Help text is associated with the select for clarity.

## Security
- Do not trust the client; re-validate `model` on the server.
- Do not log the full prompt or sensitive model details.

## Error Handling
- If `model` is invalid, return a 400 with a clear message.
- If `model` is missing, use the default model and proceed.
- If the OpenAI API call fails, return a sanitized error message and keep response details minimal.

## Testing
- Unit tests: verify client request payload includes `model` and server validation errors.
- Integration tests: verify `/api/respond` uses `model` in upstream request.
- E2E tests: verify selecting a model results in response generated with that model.

## Acceptance Criteria
- Submitting a prompt includes `model` in the request body if a model is selected; otherwise, omits `model`.
- Server rejects submissions with invalid `model` values; if `model` is missing, uses the default model.
- Server passes the selected or default model to the OpenAI Responses API and returns the result.
- UI displays help text. No error is shown for missing selection.
