# Tasks

1. **Verify test tooling configuration**
   - Ensure Vitest and Nuxt test utilities are configured.
   - Confirm available e2e tooling (Playwright or Nuxt-recommended).
   - Output: baseline test commands run without errors.

2. **Create unit tests for prompt validation**
   - Add tests for empty, whitespace-only, and valid prompts.
   - Output: failing tests that define expected validation behavior.

3. **Implement prompt validation helper**
   - Add validation utility to pass tests from Task 2.
   - Output: all prompt validation unit tests passing.

4. **Define request/response state types**
   - Add shared types for request payload and UI state.
   - Output: types compile and are referenced by tests/utilities.

5. **Create unit tests for request state transitions**
   - Test idle → loading → success and idle → loading → error.
   - Output: failing tests describing expected state changes.

6. **Implement request state management**
   - Add composable or utility that satisfies Task 5 tests.
   - Output: state transition unit tests passing.

7. **Create integration tests for server route validation**
   - Test 400 response for invalid prompts.
   - Output: failing integration tests for invalid input handling.

8. **Implement server route validation**
   - Ensure server route rejects invalid prompts with helpful error message.
   - Output: validation integration tests passing.

9. **Create integration tests for OpenAI Responses API call**
   - Test success response formatting and error normalization.
   - Output: failing tests for upstream API handling.

10. **Implement OpenAI Responses API call in server route**
    - Use `runtimeConfig` for API key and call Responses API.
    - Output: API call integration tests passing.

11. **Create component/unit tests for UI states**
    - Test rendering for idle, loading, success, and error states.
    - Output: failing UI tests that define expected rendering.

12. **Implement UI form and state rendering**
    - Build form, loading message + spinner, response/error regions, and footer links.
    - Output: UI tests passing for all states.

13. **Add accessibility attributes and live regions**
    - Add labels, `aria-live`, and focus handling for errors.
    - Output: UI tests updated and passing for accessibility behaviors.

14. **Write E2E tests for happy path**
    - Submit prompt and verify loading → response flow.
    - Output: failing E2E test defining expected flow.

15. **Write E2E tests for error path**
    - Simulate API failure and verify error messaging.
    - Output: failing E2E test defining error behavior.

16. **Add E2E test fixtures/mocks**
    - Provide mock API responses for success and error cases.
    - Output: E2E tests pass deterministically.

17. **Add `.env.example` and confirm `.gitignore`**
    - Document `OPENAI_API_KEY` in `.env.example` and verify `.env` is ignored.
    - Output: env docs present and secrets excluded from git.

18. **Update `README.md` with setup and run instructions**
    - Include environment setup, dev server, and test commands.
    - Output: README matches current app and test workflow.
