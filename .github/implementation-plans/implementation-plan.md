# Implementation plan

## Goals
- Build a Nuxt 4 + Vue 3 app that sends user prompts to the OpenAI Responses API via a secure server route.
- Provide a clear loading state, show the final response, and handle errors gracefully.
- Keep secrets server-side with `runtimeConfig` and `.env`.
- Add docs and sample environment configuration.
- Use TDD with unit, integration, and end-to-end tests following a red-green-refactor loop.

## Assumptions and constraints
- Use Nuxt 4 conventions with server routes for API calls.
- Do not expose the OpenAI API key in client code or logs.
- Keep dependencies minimal unless a test tool is needed.

## Proposed architecture
- **UI page**: A single page containing the prompt form, loading state, response display, and the footer disclosure text with links.
- **Server route**: A Nuxt server route that accepts the prompt, validates it, and calls the OpenAI Responses API using the server-only API key from `runtimeConfig`.
- **Composable/utilities**: Optional minimal composable to manage request state (idle/loading/success/error) and response data.
- **Types**: Type definitions for request payloads and response state for clarity.
- **Docs**: Update `README.md` and add `.env.example`.

## Accessibility considerations (plan)
- Ensure clear focus states and keyboard operability for the form.
- Provide descriptive labels and error messages tied to inputs.
- Use a live region for loading and error announcements.
- Ensure the footer text and links are accessible and visible with sufficient contrast.

## Test-driven development approach
Use a red-green-refactor loop for each slice of functionality:
1. **Red**: Write the failing test for the next behavior.
2. **Green**: Implement the smallest change to pass.
3. **Refactor**: Clean up, improve naming/structure, keep tests green.

## Test plan
### Unit tests (Vitest)
- **Prompt validation**: Reject empty or whitespace-only prompts; accept valid strings.
- **State management**: Verify state transitions (idle → loading → success/error).
- **Error normalization**: Ensure server errors map to a consistent client-facing structure.

### Integration tests (Vitest + Nuxt test utilities)
- **Server route**: Verify request validation, OpenAI API call, and structured responses.
- **Runtime config**: Ensure the API key is read from `runtimeConfig` and not returned.
- **Non-2xx handling**: Simulate API error responses and verify error payloads.

### End-to-end tests (Playwright or Nuxt e2e tooling)
- **Happy path**: Enter prompt, submit, see loading state, then response content.
- **Error path**: Simulate API failure, verify user-friendly error message.
- **Accessibility smoke checks**: Ensure form labels, tab order, and live regions work.

## Step-by-step implementation plan (TDD)
1. **Testing scaffolding**
   - Add/verify test configuration for Vitest and any Nuxt test utilities.
   - Add Playwright (or Nuxt-recommended e2e tooling) if not present.
   - Create baseline test files and a minimal test command.

2. **Define shared types and validation (Unit tests first)**
   - Write unit tests for prompt validation helpers.
   - Implement the validation helper and types for request/response state.

3. **Server route (Integration tests first)**
   - Write integration tests for the server route behavior:
     - Accepts valid prompt and returns a formatted response payload.
     - Rejects invalid prompt with a 400 and helpful error message.
     - Handles upstream OpenAI errors (rate limit, auth, network).
   - Implement the server route using the Responses API with `runtimeConfig`.
   - Refactor to keep the server logic small and testable.

4. **Client UI (Unit tests first, then E2E)**
   - Write unit tests for the request state composable (if used).
   - Implement the composable for loading/error/result state.
   - Write component tests (if used) to verify UI states based on props/state.
   - Implement the form UI:
     - Input + submit button
     - Loading text + spinner
     - Response and error message region
     - Footer disclosure with links
   - Add accessibility attributes (labels, `aria-live`, focus handling).

5. **E2E flows**
   - Write E2E tests for submit behavior, loading state, response rendering.
   - Add a mock server or fixture to simulate API success and error cases.
   - Run E2E tests and refactor as needed.

6. **Environment configuration and docs**
   - Add `.env.example` with `OPENAI_API_KEY` placeholder.
   - Confirm `.env` is in `.gitignore`.
   - Update `README.md` with setup, run, and test instructions.

## Deliverables
- Nuxt 4 app with UI, server route, and request handling.
- Unit, integration, and E2E tests covering critical flows.
- `.env.example` and updated `README.md`.

## Verification checklist
- All tests passing (unit, integration, E2E).
- No secrets exposed in client bundles.
- Loading and error states are accessible and user-friendly.
- README and environment setup are accurate.
