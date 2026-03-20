# Task List: Query OpenAI Models Feature Implementation

**Reference**: `.github/implementation-plans/implementation-plan-to-query-for-openai-models.md`

**Implementation Approach**: Test-Driven Development (TDD) with red-green-refactor cycles

**Total Tasks**: 42 (organized in dependency order)

---

## Phase 1: Type Definitions (Dependency: None)

### Task 1.1: Create models type definitions file
**Description**: Create `types/models.ts` with TypeScript type definitions for OpenAI Models API responses.

**Acceptance Criteria**:
- File `types/models.ts` exists
- Exports `OpenAIModel` type with properties: `id`, `object`, `created`, `owned_by`
- Exports `ModelsResponse` type with properties: `object`, `data[]`
- Exports `ModelsErrorResponse` type with properties: `message`, `details?`
- All types are properly documented with JSDoc comments
- TypeScript compiler validates all types with `npx tsc --noEmit`

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Types file created
- No TypeScript compilation errors
- Types are exported and usable by other modules

---

## Phase 2: Backend Integration Tests (Dependency: Phase 1)

### Task 2.1: Create models.test.ts integration test file with test setup
**Description**: Create `tests/integration/models.test.ts` file with proper test setup (mocked OpenAI server, environment configuration).

**Acceptance Criteria**:
- File `tests/integration/models.test.ts` exists
- Imports all necessary testing utilities: `vitest`, `@nuxt/test-utils`
- Mock HTTP server is created to simulate OpenAI API
- Test environment variables are set (`OPENAI_API_KEY`, `OPENAI_BASE_URL`)
- Mock server lifecycle is managed (setup/cleanup)
- Mock server can be configured per test (status, response body)
- File compiles without TypeScript errors

**Size Estimate**: 1 hour

**Done Criteria**:
- Test file exists with complete setup
- Mock server can be started/stopped
- Environment configuration is applied
- No linting errors

### Task 2.2: Write test - returns 500 when API key is missing
**Description**: Write test case that verifies server returns 500 status when `OPENAI_API_KEY` is not configured.

**Acceptance Criteria**:
- Test exists and is named descriptively
- Test unsets `OPENAI_API_KEY` environment variable
- Test makes GET request to `/api/models`
- Test verifies response status is 500
- Test verifies error message is present
- Test follows Arrange-Act-Assert pattern
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected
- Test is independently runnable

### Task 2.3: Write test - constructs correct URL from baseUrl config
**Description**: Write test case that verifies the server constructs the correct OpenAI API URL from `runtimeConfig.openaiBaseUrl`.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks OpenAI server to verify request URL
- Test verifies URL path includes `/models` endpoint
- Test handles different `baseUrl` formats (with/without trailing slash)
- Test captures the actual request made to mock server
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected
- Mock server captures request details

### Task 2.4: Write test - includes Authorization header with Bearer token
**Description**: Write test case that verifies the server includes the `Authorization` header with Bearer token.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test sets `OPENAI_API_KEY` to known test value
- Test makes request and captures Authorization header
- Test verifies header format is `Bearer ${apiKey}`
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.5: Write test - returns models list on successful response
**Description**: Write test case that verifies server returns models list when OpenAI API responds successfully.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server responds with valid models array (2-3 models)
- Test makes GET request to `/api/models`
- Test verifies response contains `data` array
- Test verifies response structure matches `ModelsResponse` type
- Test verifies at least one model is in the response
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.6: Write test - removes object field from individual models
**Description**: Write test case that verifies the server removes the `object` field from individual model objects (per spec).

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server responds with models that have `object: "model"` property
- Test verifies response models do NOT have `object` property
- Test verifies other properties (id, created, owned_by) are intact
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.7: Write test - returns error message when OpenAI API fails
**Description**: Write test case that verifies server returns error message and details when OpenAI API fails.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server responds with 401 status (invalid API key)
- Mock server response includes error object with message
- Test verifies response includes error message
- Test verifies response includes status code
- Test verifies error message is not null/empty
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.8: Write test - handles network timeouts gracefully
**Description**: Write test case that verifies server handles network timeout from OpenAI API.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server is configured to not respond (or respond slowly)
- Test makes request with timeout configured
- Test verifies appropriate error response (5xx status)
- Test verifies error message is user-friendly (not raw network error)
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.9: Write test - handles malformed JSON responses
**Description**: Write test case that verifies server gracefully handles malformed JSON from OpenAI API.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server responds with invalid JSON (empty string, corrupted JSON)
- Test verifies response includes error message
- Test verifies application doesn't crash
- Test verifies appropriate error status (5xx)
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 2.10: Write test - maps HTTP status codes correctly
**Description**: Write test case that verifies server returns appropriate HTTP status codes for different OpenAI API errors.

**Acceptance Criteria**:
- Test exists (or multiple tests for different status codes)
- Tests include scenarios: 401 (unauthorized), 403 (forbidden), 429 (rate limit), 500 (server error)
- For each scenario, mock server responds with that status
- Test verifies response status matches or is appropriately mapped
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Tests are written and fail as expected

### Task 2.11: Write test - sanitizes error details to prevent sensitive data exposure
**Description**: Write test case that verifies server sanitizes error details to prevent API key or other sensitive data leakage.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock server returns error with sensitive details (API keys, bearer tokens)
- Test verifies response error details don't contain API keys
- Test verifies response error details don't contain bearer tokens
- Test verifies response is sanitized but still informative
- **Test Status**: RED (fails because route doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

---

## Phase 2.5: Backend Implementation (Dependency: Phase 2)

### Task 2.12: Implement server/api/models.get.ts - minimal route handler
**Description**: Create minimal `server/api/models.get.ts` route handler that makes all Phase 2 tests pass.

**Acceptance Criteria**:
- File `server/api/models.get.ts` exists
- Implements `defineEventHandler` to handle GET requests
- Reads `openaiApiKey` and `openaiBaseUrl` from `useRuntimeConfig()`
- Returns 500 error if API key is missing
- Constructs URL to OpenAI `/models` endpoint
- Makes HTTP fetch request with Authorization header
- Parses JSON response
- Removes `object` field from individual models
- Handles errors and returns appropriate status codes
- All Phase 2.1-2.11 integration tests PASS (GREEN)
- Code follows existing patterns from `server/api/respond.post.ts`

**Size Estimate**: 2 hours

**Done Criteria**:
- All 11 integration tests pass
- No TypeScript errors
- No ESLint errors

### Task 2.13: Refactor server route - extract URL construction to helper function
**Description**: Refactor `server/api/models.get.ts` to extract URL construction logic into a helper function.

**Acceptance Criteria**:
- Helper function created (same file or separate utility)
- Function handles different baseUrl formats (with/without trailing slash)
- Function returns properly constructed URL to `/models` endpoint
- All integration tests still pass (GREEN)
- Code is more testable and maintainable

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Helper function extracted
- All integration tests still pass
- No code duplication

### Task 2.14: Refactor server route - extract error sanitization to helper function
**Description**: Refactor `server/api/models.get.ts` to extract error sanitization logic into a helper function.

**Acceptance Criteria**:
- Helper function created to sanitize error details
- Function removes sensitive data (API keys, tokens)
- Function preserves useful error information
- Function is reusable and well-tested
- All integration tests still pass (GREEN)

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Helper function extracted
- All integration tests still pass
- Error sanitization is effective

### Task 2.15: Verify server route follows security guidelines
**Description**: Review and verify `server/api/models.get.ts` follows all security guidelines from `.github/instructions/security-and-owasp.instructions.md`.

**Acceptance Criteria**:
- API key is never exposed in client-side code
- Error messages don't leak sensitive information
- All input validation is present
- HTTPS is enforced (inherited from OpenAI base URL)
- No hardcoded secrets in code
- Error handling follows security best practices
- Code passes security checklist review

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Security review completed
- No security issues identified
- All integration tests still pass

---

## Phase 3: Frontend State Management Unit Tests (Dependency: Phase 1)

### Task 3.1: Create models-list.test.ts unit test file
**Description**: Create `tests/unit/models-list.test.ts` file with test setup for composable unit tests.

**Acceptance Criteria**:
- File `tests/unit/models-list.test.ts` exists
- Imports necessary utilities: `vitest`, `@vue/test-utils`
- Mocks `$fetch` from Nuxt
- Test environment is properly configured
- File compiles without TypeScript errors

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Test file exists with proper setup
- Mocks are configured
- No compilation errors

### Task 3.2: Write test - initial state is idle with null data and error
**Description**: Write test case for composable initial state.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test initializes composable
- Test verifies initial status is "idle"
- Test verifies initial data is null
- Test verifies initial error is null
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.3: Write test - status transitions to loading when fetch is called
**Description**: Write test case that verifies status changes to "loading" when fetch is initiated.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test calls fetch method
- Test verifies status transitions to "loading"
- Test follows state transition pattern
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.4: Write test - status transitions to success with data when API succeeds
**Description**: Write test case that verifies successful state transition and data population.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock `$fetch` to return successful models response
- Test calls fetch method
- Test verifies status transitions to "success"
- Test verifies data is populated with models
- Test verifies error is null
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.5: Write test - status transitions to error with message when API fails
**Description**: Write test case that verifies error state transition and error message handling.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock `$fetch` to throw an error
- Test calls fetch method
- Test verifies status transitions to "error"
- Test verifies error message is captured
- Test verifies data is null
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.6: Write test - fetch is called immediately when composable is initialized
**Description**: Write test case that verifies fetch is called automatically on initialization.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock `$fetch` to track if it's called
- Test initializes composable
- Test verifies `$fetch` is called immediately (onMounted or immediate effect)
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.7: Write test - error state includes both message and details
**Description**: Write test case that verifies error details are properly captured.

**Acceptance Criteria**:
- Test exists with descriptive name
- Mock `$fetch` to return error with message and details
- Test verifies both message and details are in error state
- Test verifies error object structure matches expectations
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 3.8: Write test - multiple fetch calls update state correctly
**Description**: Write test case that verifies composable handles multiple sequential fetch calls.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test calls fetch multiple times with different mock responses
- Test verifies state is updated correctly each time
- Test verifies no race conditions in state updates
- **Test Status**: RED (fails because composable doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

---

## Phase 3.5: Frontend State Management Implementation (Dependency: Phase 3)

### Task 3.9: Implement app/composables/use-models-state.ts - minimal composable
**Description**: Create minimal `app/composables/use-models-state.ts` composable that makes all Phase 3 tests pass.

**Acceptance Criteria**:
- File `app/composables/use-models-state.ts` exists
- Exports `useModelsState` composable function
- Composable creates reactive state with: status, data, error, errorDetails
- Composable implements `fetchModels()` function to call `/api/models`
- Composable calls fetch immediately on initialization
- Composable handles loading, success, and error states
- Composable properly sets and clears error messages
- All Phase 3.2-3.8 unit tests PASS (GREEN)
- Code follows patterns from `app/composables/use-request-state.ts`

**Size Estimate**: 1.5 hours

**Done Criteria**:
- All 7 unit tests pass
- Composable can be imported and used
- No TypeScript errors
- No ESLint errors

### Task 3.10: Refactor composable - extract error message formatting to helper function
**Description**: Refactor composable to extract error message formatting into a helper function.

**Acceptance Criteria**:
- Helper function created to format error messages
- Function handles different error types (string, Error object, response details)
- Function is reusable
- All unit tests still pass (GREEN)
- Code is more maintainable

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Helper function extracted
- All unit tests still pass
- No code duplication

### Task 3.11: Verify composable follows Vue 3 best practices
**Description**: Review and verify `use-models-state.ts` follows Vue 3 and Composition API guidelines.

**Acceptance Criteria**:
- Composable uses Vue reactivity properly (ref, reactive, computed)
- State transitions are clear and testable
- No side effects outside of fetch logic
- JSDoc comments document public API
- Naming follows convention (`use-*`)
- Code follows guidelines from `.github/instructions/vuejs3.instructions.md`
- All unit tests still pass

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Code review completed
- All best practices followed
- All unit tests still pass

---

## Phase 4: Frontend UI Component Tests (Dependency: Phase 1, Phase 3)

### Task 4.1: Create app.models-section.test.ts component test file
**Description**: Create `tests/unit/app.models-section.test.ts` file with test setup for app component tests.

**Acceptance Criteria**:
- File `tests/unit/app.models-section.test.ts` exists
- Imports necessary utilities: `vitest`, `@vue/test-utils`, `mount`
- Mocks `use-models-state` composable
- Test environment is properly configured
- File compiles without TypeScript errors

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Test file exists with proper setup
- Composables are mocked
- No compilation errors

### Task 4.2: Write test - models section is rendered in the DOM
**Description**: Write test case that verifies models section element is rendered.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mounts App component
- Test verifies models section element exists in DOM
- Test verifies section has proper role or ARIA attributes
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.3: Write test - loading spinner appears when status is "loading"
**Description**: Write test case that verifies loading state UI.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with status "loading"
- Test mounts App component
- Test verifies loading spinner element is visible
- Test verifies other states are hidden
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.4: Write test - loading text displays "Loading available models..."
**Description**: Write test case that verifies correct loading text is displayed.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with status "loading"
- Test mounts App component
- Test verifies exact text "Loading available models..." is present
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.5: Write test - models list appears when status is "success"
**Description**: Write test case that verifies success state UI with models list.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with status "success" and models data
- Test mounts App component
- Test verifies models list (`<ul>` or similar) is rendered
- Test verifies loading and error states are hidden
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.6: Write test - each model displays id, owned_by, and created date
**Description**: Write test case that verifies model card content.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with sample models data
- Test mounts App component
- Test verifies each model displays: id, owned_by, created
- Test verifies all sample models are rendered
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.7: Write test - error message appears when status is "error"
**Description**: Write test case that verifies error state UI.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with status "error" and error message
- Test mounts App component
- Test verifies error section is visible
- Test verifies other states are hidden
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.8: Write test - error message format matches specification
**Description**: Write test case that verifies exact error message format.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with error
- Test mounts App component
- Test verifies error message starts with "Error: Failed API call, could not get list of OpenAI models"
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.9: Write test - error details are displayed when available
**Description**: Write test case that verifies error details display.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with error message and details
- Test mounts App component
- Test verifies error details are displayed
- Test verifies error details are not displayed when null
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.10: Write test - nothing renders when status is "idle"
**Description**: Write test case that verifies no content appears in idle state.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks composable state with status "idle"
- Test mounts App component
- Test verifies models section exists but is empty (or hidden)
- Test verifies no loading, success, or error content is visible
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.11: Write test - models section appears between form and chat response area
**Description**: Write test case that verifies UI layout and element order.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mounts App component
- Test verifies DOM structure: form → models section → response area
- Test uses proper DOM querying to verify order
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

### Task 4.12: Write test - composable is initialized and used on component mount
**Description**: Write test case that verifies composable lifecycle integration.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `useModelsState` composable
- Test verifies composable is called when component mounts
- Test verifies composable state is used to render UI
- **Test Status**: RED (fails because UI doesn't exist yet)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and fails as expected

---

## Phase 4.5: Frontend UI Component Implementation (Dependency: Phase 4)

### Task 4.13: Implement models section in app.vue - minimal UI
**Description**: Add models section to `app/app.vue` with all state variations to make Phase 4 tests pass.

**Acceptance Criteria**:
- Models section added to `app.vue` template after form, before response section
- Section has proper semantic HTML structure (`<section>` tag)
- Implements conditional rendering for: loading, success, error, idle states
- Loading state: displays spinner and "Loading available models..." text
- Success state: displays list of models with id, owned_by, created
- Error state: displays error message matching specification format
- Error details displayed when available
- Idle state: nothing is rendered
- `useModelsState` composable is imported and initialized
- All Phase 4.2-4.12 component tests PASS (GREEN)

**Size Estimate**: 1.5 hours

**Done Criteria**:
- All 11 component tests pass
- UI renders correctly in all states
- No TypeScript errors
- No ESLint errors

### Task 4.14: Implement models section - add accessibility attributes
**Description**: Add accessibility attributes to models section in `app.vue`.

**Acceptance Criteria**:
- Models section has `aria-live="polite"` for dynamic updates
- Error state has `role="alert"`
- Loading spinner has appropriate `aria-label` or text alternative
- Models list uses semantic HTML: `<ul>` and `<li>` elements
- All ARIA attributes are proper and meaningful
- Code follows `.github/instructions/a11y.instructions.md` guidelines
- All component tests still pass

**Size Estimate**: 0.75 hours

**Done Criteria**:
- All accessibility attributes added
- All component tests still pass
- Accessibility review completed

### Task 4.15: Implement models section - apply Tailwind CSS styling
**Description**: Add Tailwind CSS classes to models section in `app.vue` for visual styling.

**Acceptance Criteria**:
- Styling is consistent with existing app design
- Loading state styling matches existing spinner pattern
- Success state: card layout with proper spacing and visual hierarchy
- Error state: red/alert color scheme matching existing error styling
- Models display as cards or list items with clear visual separation
- Responsive design works on mobile, tablet, desktop
- Sufficient color contrast (4.5:1 for text, per WCAG AA)
- All component tests still pass

**Size Estimate**: 1 hour

**Done Criteria**:
- Tailwind classes applied appropriately
- Design is visually consistent
- Responsive on all screen sizes
- All component tests still pass

### Task 4.16: Verify models section follows Vue 3 best practices
**Description**: Review and verify models section implementation in `app.vue` follows Vue 3 guidelines.

**Acceptance Criteria**:
- Template syntax follows Vue 3 best practices
- Proper use of `v-if`, `v-else-if`, `v-for`, etc.
- Props and reactive data are properly typed
- Composable usage is correct
- Code follows guidelines from `.github/instructions/vuejs3.instructions.md`
- All component tests still pass

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Code review completed
- All best practices followed
- All component tests still pass

---

## Phase 5: End-to-End Tests (Dependency: Phase 2.12, Phase 3.9, Phase 4.13)

### Task 5.1: Create models.spec.ts E2E test file
**Description**: Create `tests/e2e/models.spec.ts` file with E2E test setup.

**Acceptance Criteria**:
- File `tests/e2e/models.spec.ts` exists
- Imports Playwright testing utilities
- Uses existing E2E setup from `tests/e2e/app.spec.ts` pattern
- Can mock `/api/models` endpoint with route interception
- File compiles without errors

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Test file exists with proper setup
- Can mock API responses
- No compilation errors

### Task 5.2: Write E2E test - models section appears after app loads
**Description**: Write E2E test that verifies models section is visible after app loads.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test navigates to app URL
- Test waits for models section to appear
- Test verifies models section element is visible in DOM
- **Test Status**: RED (initially fails, will pass after all backend/frontend implementation)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.3: Write E2E test - loading spinner is visible initially
**Description**: Write E2E test that verifies loading state is shown while fetching.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `/api/models` endpoint to delay response
- Test verifies loading spinner is visible
- Test verifies loading text "Loading available models..." is displayed
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.4: Write E2E test - models list appears after successful API call
**Description**: Write E2E test that verifies models display after successful fetch.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `/api/models` to return valid models data
- Test verifies loading spinner disappears
- Test verifies models list appears
- Test waits appropriately for API response
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.5: Write E2E test - at least one model is displayed
**Description**: Write E2E test that verifies at least one model item is rendered.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test verifies at least one model item is visible
- Test counts or locates model elements
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.6: Write E2E test - model IDs are visible (e.g., gpt-4, gpt-3.5-turbo)
**Description**: Write E2E test that verifies model IDs are displayed in the UI.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `/api/models` with models having realistic IDs
- Test verifies at least one model ID (e.g., "gpt-4") is visible in the page
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.7: Write E2E test - error message displays when API key is invalid
**Description**: Write E2E test that verifies error display on API authentication failure.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `/api/models` to return 401 (unauthorized)
- Test verifies error message is displayed
- Test verifies error message matches specification format
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.8: Write E2E test - error message displays when network fails
**Description**: Write E2E test that verifies error handling on network failure.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test mocks `/api/models` to fail with network error
- Test verifies error message is displayed to user
- Test verifies error is user-friendly (not raw network error)
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.9: Write E2E test - page layout includes form, models section, response area in correct order
**Description**: Write E2E test that verifies correct UI layout and element ordering.

**Acceptance Criteria**:
- Test exists with descriptive name
- Test verifies form is rendered
- Test verifies models section appears after form
- Test verifies response area appears after models section
- Test verifies correct visual order in page layout
- **Test Status**: RED (initially fails)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- Test is written and can be executed

### Task 5.10: Execute E2E tests and fix any integration issues
**Description**: Run E2E tests and resolve any failures or timing issues.

**Acceptance Criteria**:
- E2E tests are executable: `npm run test:e2e`
- All 8 E2E tests PASS (GREEN)
- No flaky tests or timing issues
- Tests are stable when run multiple times

**Size Estimate**: 1.5 hours

**Done Criteria**:
- All E2E tests pass consistently
- No race conditions
- Tests are repeatable

### Task 5.11: Refactor E2E tests - extract common utilities
**Description**: Refactor E2E tests to extract common patterns and helpers.

**Acceptance Criteria**:
- Common setup/teardown logic is extracted
- Mock response helpers are reusable
- Page object pattern used if beneficial
- All E2E tests still pass
- Tests are more maintainable

**Size Estimate**: 0.75 hours

**Done Criteria**:
- Common utilities extracted
- All E2E tests still pass
- Test code is DRY

---

## Phase 6: Security and Accessibility Review (Dependency: Phase 4.15)

### Task 6.1: Perform security review - verify no secrets exposure
**Description**: Review code to ensure API keys and sensitive data are never exposed to client.

**Acceptance Criteria**:
- API key is read only on server-side (in `models.get.ts`)
- API key is never sent to frontend JavaScript
- No secrets in frontend composables or components
- No secrets in console logs or network requests visible from browser
- Error messages don't leak API keys or bearer tokens
- Code follows `.github/instructions/security-and-owasp.instructions.md`

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Security review completed
- No secrets exposure found
- All tests still pass

### Task 6.2: Perform accessibility review - verify WCAG 2.2 AA compliance
**Description**: Review code and UI to ensure accessibility compliance.

**Acceptance Criteria**:
- Models section has proper ARIA attributes (`aria-live`, `role="alert"`)
- Loading state is properly announced to screen readers
- Error state is properly announced as alert
- Models list uses semantic HTML (`<ul>`, `<li>`)
- Color contrast is sufficient (4.5:1 for text)
- Keyboard navigation works for all interactive elements
- Code follows `.github/instructions/a11y.instructions.md`
- All component tests still pass

**Size Estimate**: 1 hour

**Done Criteria**:
- Accessibility review completed
- WCAG 2.2 AA compliance verified
- No accessibility issues found

### Task 6.3: Test with accessibility tools
**Description**: Test the implementation with automated accessibility checking tools.

**Acceptance Criteria**:
- Run app in browser (e.g., local dev server)
- Use Accessibility Insights or similar tool to check for issues
- No critical or major accessibility issues found
- Address any issues identified
- Document any limitations or exemptions

**Size Estimate**: 0.75 hours

**Done Criteria**:
- Accessibility tool testing completed
- Issues identified and resolved
- All tests still pass

---

## Phase 7: Documentation Updates (Dependency: Phase 4.15)

### Task 7.1: Update README.md with models feature description
**Description**: Add documentation about the new models list feature to README.

**Acceptance Criteria**:
- README.md has new section describing the models feature
- Section explains what the models list shows
- Section explains where it appears in the UI
- Section explains error handling
- Documentation is clear and user-friendly
- Follows existing documentation style in README

**Size Estimate**: 0.5 hours

**Done Criteria**:
- README updated with feature documentation
- Documentation is clear and complete

### Task 7.2: Update CHANGELOG.md with feature entry
**Description**: Add entry to CHANGELOG documenting the new feature.

**Acceptance Criteria**:
- CHANGELOG.md has new entry for models feature
- Entry includes: feature description, version, date
- Follows existing CHANGELOG format and conventions
- Entry is in appropriate section (e.g., "Added" for new features)

**Size Estimate**: 0.25 hours

**Done Criteria**:
- CHANGELOG updated with feature entry
- Entry follows project conventions

### Task 7.3: Verify .env.example documents OPENAI_API_KEY
**Description**: Verify `.env.example` file documents the API key requirement.

**Acceptance Criteria**:
- `.env.example` file exists (should already exist)
- Contains `OPENAI_API_KEY` variable documented
- Documentation explains it's required for models feature
- Example format is clear

**Size Estimate**: 0.25 hours

**Done Criteria**:
- `.env.example` verified/updated
- Documentation is clear

---

## Phase 8: Code Quality and Review (Dependency: Phase 7)

### Task 8.1: Run TypeScript compiler and fix any errors
**Description**: Run TypeScript compiler in strict mode to validate all code.

**Acceptance Criteria**:
- Command `npx tsc --noEmit` runs successfully
- No TypeScript errors in any phase files
- All types are properly annotated
- No use of `any` type unless absolutely necessary (with comments)

**Size Estimate**: 0.5 hours

**Done Criteria**:
- TypeScript compilation succeeds
- No type errors
- All files validated

### Task 8.2: Run linter and fix any style issues
**Description**: Run ESLint to check code style and catch potential issues.

**Acceptance Criteria**:
- Command `npm run lint` runs successfully (or appropriate lint command)
- No ESLint errors in any phase files
- All code follows project style guidelines
- Any warnings are addressed or documented

**Size Estimate**: 0.5 hours

**Done Criteria**:
- ESLint passes
- All style issues resolved
- Code is consistent

### Task 8.3: Run all tests and verify they all pass
**Description**: Execute full test suite to verify all implementation.

**Acceptance Criteria**:
- Command `npm test` runs successfully
- All unit tests pass (models-list, app.models-section)
- All integration tests pass (models API route)
- All E2E tests pass (models feature flow)
- Total: 84+ tests passing (65 existing + new tests)
- No flaky tests

**Size Estimate**: 0.5 hours

**Done Criteria**:
- All tests pass
- No test failures
- Test suite is stable

### Task 8.4: Check test coverage for new code
**Description**: Verify test coverage for new implementation meets standards.

**Acceptance Criteria**:
- Generate coverage report: `npm run test:coverage`
- New code (`types/models.ts`, `models.get.ts`, `use-models-state.ts`, models section in `app.vue`) has > 80% coverage
- Critical paths have 100% coverage
- Coverage report is reviewed

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Coverage report generated
- Coverage targets met
- Critical paths fully tested

### Task 8.5: Perform code review against project guidelines
**Description**: Review code against all project coding guidelines and standards.

**Acceptance Criteria**:
- Code follows `.github/instructions/code-review-generic.instructions.md` guidelines
- Code follows `.github/instructions/self-explanatory-code-commenting.instructions.md` guidelines
- Code follows `.github/instructions/typescript-5-es2022.instructions.md` guidelines
- Code follows `.github/instructions/vuejs3.instructions.md` guidelines
- Code follows `.github/instructions/nodejs-javascript-vitest.instructions.md` test guidelines
- No code duplication (DRY principle)
- Functions are small and focused (< 30 lines)
- Names are descriptive
- Error handling is appropriate
- Comments explain WHY, not WHAT

**Size Estimate**: 1 hour

**Done Criteria**:
- Code review completed
- All guidelines followed
- Issues identified and resolved
- All tests still pass

### Task 8.6: Verify code follows security and accessibility best practices
**Description**: Final verification that security and accessibility are properly implemented.

**Acceptance Criteria**:
- Security checklist from Phase 6.1 is verified
- Accessibility checklist from Phase 6.2 is verified
- No secrets are exposed
- No accessibility violations identified
- Code is production-ready

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Security and accessibility verified
- All best practices implemented
- Code is production-ready

### Task 8.7: Final cleanup and optimization
**Description**: Final code cleanup, unused imports removal, and optimization.

**Acceptance Criteria**:
- All unused imports are removed
- No dead code
- Code is optimized for readability and performance
- No console logs or debug code in production code
- All files follow project conventions
- All tests still pass

**Size Estimate**: 0.5 hours

**Done Criteria**:
- Code cleanup completed
- All tests still pass
- Code is ready for merge

---

## Summary

**Total Tasks**: 42

**Estimated Total Time**: 20-25 hours

**Task Breakdown by Phase**:
- Phase 1 (Types): 1 task (0.5 hours)
- Phase 2 (Backend): 11 tests + 4 implementation/refactor = 15 tasks (5 hours)
- Phase 3 (Composable): 7 tests + 3 implementation/refactor = 10 tasks (3.5 hours)
- Phase 4 (UI Component): 12 tests + 4 implementation/refactor = 16 tasks (5 hours)
- Phase 5 (E2E): 8 tests + 3 implementation = 11 tasks (2.5 hours)
- Phase 6 (Security/A11y): 3 tasks (2.25 hours)
- Phase 7 (Documentation): 3 tasks (1 hour)
- Phase 8 (Quality): 7 tasks (3.5 hours)

**Note**: Tasks are ordered by dependency. Each phase should be completed sequentially, but tasks within a phase can often be completed in parallel if resources allow.

**Validation Criteria for Complete Implementation**:
- ✅ All 42 tasks completed
- ✅ All tests passing (unit, integration, E2E)
- ✅ TypeScript compilation clean
- ✅ ESLint passing
- ✅ Test coverage > 80%
- ✅ Security verified (no secrets exposure)
- ✅ Accessibility verified (WCAG 2.2 AA)
- ✅ Documentation updated
- ✅ Code review passed

**Ready for Deployment When**:
- All success criteria met
- All tests passing
- Code review approved
- No blocking issues
