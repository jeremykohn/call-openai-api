# Implementation Plan: Query OpenAI Models on App Load

## Overview

This document outlines the Test-Driven Development (TDD) approach for implementing the feature to query and display OpenAI models when the application loads. The implementation follows a red-green-refactor loop with comprehensive unit, integration, and end-to-end testing.

**Specification Reference**: `.github/specs/application-specifications-query-for-openai-models.md`

---

## Implementation Strategy

### Core Principles

1. **Test-Driven Development (TDD)**: Write tests first, implement minimal code to pass, then refactor
2. **Red-Green-Refactor Loop**: Failing test → passing test → clean code
3. **Progressive Enhancement**: Build incrementally, testing at each layer
4. **Type Safety**: Leverage TypeScript for compile-time safety
5. **Consistency**: Follow existing patterns in the codebase

### Testing Layers

1. **Unit Tests**: Test individual functions, composables, and utility logic in isolation
2. **Integration Tests**: Test API routes with mocked external services
3. **End-to-End Tests**: Test complete user flows with real component rendering

---

## Phase 1: Type Definitions and Data Structures

### Goal
Define TypeScript types for OpenAI models API responses before writing any implementation code.

### TDD Approach

#### Step 1.1: Create Type Definition File
**File**: `types/models.ts` (new)

**Test**: None required (type definitions don't need runtime tests, but will be validated by TypeScript compiler)

**Implementation**:
```typescript
// Define types matching OpenAI Models API response structure
export type OpenAIModel = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: "list";
  data: OpenAIModel[];
};

export type ModelsErrorResponse = {
  message: string;
  details?: string;
};
```

**Validation**: Run `npx tsc --noEmit` to ensure types are valid

---

## Phase 2: Backend Implementation (Server Route)

### Goal
Create a server route that proxies the OpenAI Models API, handling authentication and errors.

### TDD Approach

#### Step 2.1: Write Integration Tests First (RED)
**File**: `tests/integration/models.test.ts` (new)

**Tests to Write**:
1. ✅ Returns 500 if OPENAI_API_KEY is not configured
2. ✅ Constructs correct URL from baseUrl configuration
3. ✅ Includes Authorization header with Bearer token
4. ✅ Returns models list on successful OpenAI API response
5. ✅ Removes `object` field from individual model objects (per spec)
6. ✅ Returns error message and details when OpenAI API fails
7. ✅ Handles network timeouts gracefully
8. ✅ Handles malformed JSON responses
9. ✅ Maps HTTP status codes correctly (401, 403, 429, 500, etc.)
10. ✅ Sanitizes error details to prevent sensitive data exposure

**Test Setup Pattern**:
```typescript
import { describe, it, expect, afterAll } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils";
import { createServer } from "node:http";
// Mock OpenAI server similar to respond-route.test.ts pattern
```

**Expected Test Outcome**: All tests FAIL (RED) because route doesn't exist yet

#### Step 2.2: Implement Minimal Server Route (GREEN)
**File**: `server/api/models.get.ts` (new)

**Implementation Strategy**:
1. Create minimal route handler using `defineEventHandler`
2. Read `openaiApiKey` and `openaiBaseUrl` from runtime config
3. Validate API key exists (return 500 if missing)
4. Construct request URL: `${baseUrl}/models`
5. Make fetch request with Authorization header
6. Parse response and handle errors
7. Transform response to remove `object` field from models
8. Return appropriate status codes and error messages

**Pattern to Follow**: Similar structure to `server/api/respond.post.ts`:
- Use `useRuntimeConfig()` for environment variables
- Use `setResponseStatus()` for error responses
- Handle fetch errors with try-catch
- Extract and sanitize error messages
- Use consistent error response format

**Expected Outcome**: All integration tests PASS (GREEN)

#### Step 2.3: Refactor for Quality (REFACTOR)
- Extract URL construction logic into helper function if complex
- Extract error handling logic if duplicated
- Ensure code follows security guidelines from `.github/instructions/security-and-owasp.instructions.md`
- Add inline comments for non-obvious logic
- Verify TypeScript strict mode compliance

**Validation**: Re-run integration tests to ensure refactoring didn't break functionality

---

## Phase 3: Frontend State Management (Composable)

### Goal
Create a composable to manage models list state and fetching logic.

### TDD Approach

#### Step 3.1: Write Unit Tests First (RED)
**File**: `tests/unit/models-list.test.ts` (new)

**Tests to Write**:
1. ✅ Initial state is idle with null data and error
2. ✅ Status transitions to loading when fetch is called
3. ✅ Status transitions to success with data when API succeeds
4. ✅ Status transitions to error with message when API fails
5. ✅ Fetch is called immediately when composable is initialized
6. ✅ Error state includes both message and details
7. ✅ Multiple fetch calls update state correctly (edge case)
8. ✅ Handles fetch abortion on component unmount (if applicable)

**Test Setup Pattern**:
```typescript
import { describe, it, expect, vi } from "vitest";
import { useModelsState } from "../../app/composables/use-models-state";
// Mock $fetch using vi.mock
```

**Expected Test Outcome**: All tests FAIL (RED) because composable doesn't exist

#### Step 3.2: Implement Composable (GREEN)
**File**: `app/composables/use-models-state.ts` (new)

**Implementation Strategy**:
1. Create reactive state object with status, data, error properties
2. Define `fetchModels()` function to call `/api/models`
3. Handle loading, success, and error states
4. Auto-fetch on composable initialization (onMounted or immediate)
5. Return state and any needed methods

**State Shape**:
```typescript
type State = {
  status: "idle" | "loading" | "success" | "error";
  data: OpenAIModel[] | null;
  error: string | null;
  errorDetails?: string | null;
};
```

**Pattern to Follow**: Similar to `app/composables/use-request-state.ts`:
- Use Vue reactivity (ref, reactive)
- Return computed or readonly state
- Handle async operations with try-catch
- Use `$fetch` from Nuxt auto-imports

**Expected Outcome**: All unit tests PASS (GREEN)

#### Step 3.3: Refactor for Quality (REFACTOR)
- Ensure state transitions are clear and testable
- Consider extracting error message formatting
- Verify composable follows Vue 3 Composition API best practices
- Add JSDoc comments for public API
- Ensure accessibility of state for testing

**Validation**: Re-run unit tests to confirm refactoring maintains functionality

---

## Phase 4: UI Component Integration

### Goal
Integrate models section into `app/app.vue` with loading, success, and error states.

### TDD Approach

#### Step 4.1: Write Component Tests First (RED)
**File**: `tests/unit/app.models-section.test.ts` (new)

**Tests to Write**:
1. ✅ Models section is rendered in the DOM
2. ✅ Loading spinner appears when status is "loading"
3. ✅ Loading text displays "Loading available models..."
4. ✅ Models list appears when status is "success"
5. ✅ Each model displays: id, owned_by, and created date
6. ✅ Error message appears when status is "error"
7. ✅ Error message format: "Error: Failed API call, could not get list of OpenAI models"
8. ✅ Error details are displayed when available
9. ✅ Nothing renders when status is "idle"
10. ✅ Models section appears between form and chat response area
11. ✅ Composable `fetchModels` is called on component mount

**Test Setup Pattern**:
```typescript
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../../app/app.vue";
// Mock composables with vi.mock
```

**Expected Test Outcome**: All tests FAIL (RED) because UI doesn't exist yet

#### Step 4.2: Implement UI Section (GREEN)
**File**: `app/app.vue` (update)

**Implementation Strategy**:
1. Import and initialize `useModelsState` composable in `<script setup>`
2. Add models section after `<form>` element, before chat response `<section>`
3. Use `v-if`, `v-else-if` to conditionally render loading/success/error states
4. Render loading spinner (reuse existing spinner pattern from chat response)
5. Render models list with `v-for` over `state.data`
6. Render error message and details when error state
7. Apply Tailwind CSS classes consistent with existing styling

**UI Structure**:
```vue
<section class="models-section" aria-live="polite">
  <!-- Loading state -->
  <div v-if="modelsState.status === 'loading'">
    <span class="spinner"></span>
    <span>Loading available models...</span>
  </div>

  <!-- Success state -->
  <div v-else-if="modelsState.status === 'success'">
    <h2>Available Models</h2>
    <ul>
      <li v-for="model in modelsState.data" :key="model.id">
        <!-- Model card with id, owned_by, created -->
      </li>
    </ul>
  </div>

  <!-- Error state -->
  <div v-else-if="modelsState.status === 'error'" role="alert">
    <h2>Error: Failed API call, could not get list of OpenAI models</h2>
    <p>{{ modelsState.error }}</p>
    <p v-if="modelsState.errorDetails">{{ modelsState.errorDetails }}</p>
  </div>
</section>
```

**Accessibility Considerations**:
- Add `aria-live="polite"` to models section for screen reader updates
- Add `role="alert"` to error state
- Ensure loading spinner has appropriate `aria-label` or `aria-busy`
- Use semantic HTML (`<ul>`, `<li>`) for models list
- Ensure sufficient color contrast (follow `.github/instructions/a11y.instructions.md`)

**Expected Outcome**: All component tests PASS (GREEN)

#### Step 4.3: Refactor for Quality (REFACTOR)
- Extract models list item into separate component if complex (`components/ModelListItem.vue`)
- Ensure Tailwind classes follow existing design system
- Verify layout matches specification diagram
- Add appropriate spacing and visual hierarchy
- Ensure responsive design works on mobile
- Follow accessibility guidelines from instructions

**Validation**: Re-run component tests and manual visual inspection

---

## Phase 5: End-to-End Testing

### Goal
Verify complete user flow from app load to models display in a real browser environment.

### TDD Approach

#### Step 5.1: Write E2E Tests First (RED)
**File**: `tests/e2e/models.spec.ts` (new)

**Tests to Write**:
1. ✅ Models section appears after app loads
2. ✅ Loading spinner is visible initially
3. ✅ Models list appears after successful API call
4. ✅ At least one model is displayed
5. ✅ Model IDs are visible (e.g., "gpt-4", "gpt-3.5-turbo")
6. ✅ Error message displays when API key is invalid
7. ✅ Error message displays when network fails
8. ✅ Page layout includes form, models section, and response area in correct order

**Test Setup Pattern**:
```typescript
import { test, expect } from "@playwright/test";
// Use existing E2E setup from tests/e2e/app.spec.ts
```

**Mock Strategy**:
- Use Playwright's `route.fulfill()` to mock `/api/models` endpoint
- Test both success and error scenarios
- Simulate network delays for loading state verification

**Expected Test Outcome**: All tests FAIL (RED) initially, then PASS after implementation

#### Step 5.2: Ensure All E2E Tests Pass (GREEN)
- Run E2E test suite: `npm run test:e2e`
- Fix any integration issues discovered
- Ensure timing/race conditions are handled

**Expected Outcome**: All E2E tests PASS (GREEN)

#### Step 5.3: Refactor E2E Tests (REFACTOR)
- Extract common test utilities (page object model if needed)
- Ensure test stability (no flaky tests)
- Add appropriate timeouts and waits
- Document any test-specific configuration

**Validation**: Run E2E suite multiple times to ensure stability

---

## Phase 6: Cross-Cutting Concerns

### Security Review

#### Checklist (from `.github/instructions/security-and-owasp.instructions.md`):
- ✅ API key never exposed in client-side code
- ✅ Error messages don't leak sensitive information
- ✅ API calls use HTTPS (enforced by OpenAI base URL)
- ✅ Input validation on server route (API key exists check)
- ✅ No user input in models endpoint (GET request, no params)
- ✅ Error details are sanitized before sending to client

#### Implementation:
- Server route reads API key from runtime config only
- Error handling sanitizes OpenAI error responses
- No API keys in logs or client-side state

### Accessibility Review

#### Checklist (from `.github/instructions/a11y.instructions.md`):
- ✅ Loading state has appropriate ARIA attributes (`aria-busy`, `aria-live`)
- ✅ Error messages use `role="alert"`
- ✅ Models list uses semantic HTML (`<ul>`, `<li>`)
- ✅ Sufficient color contrast (4.5:1 for text, 3:1 for UI components)
- ✅ Keyboard navigation works for any interactive elements
- ✅ Screen readers can navigate and understand content
- ✅ No motion-sensitive animations (or respects `prefers-reduced-motion`)

#### Implementation:
- Add `aria-live="polite"` to models section
- Add `role="alert"` to error state
- Ensure loading spinner has text alternative
- Use semantic HTML throughout
- Follow existing Tailwind color classes for consistency

### Documentation Updates

#### Files to Update:
1. **README.md**: Add section about models list feature
2. **CHANGELOG.md**: Add entry for new feature
3. **`.env.example`**: Ensure `OPENAI_API_KEY` is documented (already exists)

#### Documentation Pattern (from `.github/instructions/update-docs-on-code-change.instructions.md`):
- Update README with feature description
- Add usage example showing models section
- Document error states and troubleshooting
- Update changelog with version and feature description

---

## Phase 7: Code Quality and Cleanup

### Code Review Checklist

#### From `.github/instructions/code-review-generic.instructions.md`:
- ✅ No code duplication (DRY principle)
- ✅ Functions are small and focused (< 30 lines)
- ✅ Descriptive variable and function names
- ✅ Error handling at appropriate levels
- ✅ No magic numbers or strings (use constants)
- ✅ Self-documenting code with minimal comments
- ✅ Follows existing code patterns in project

#### From `.github/instructions/self-explanatory-code-commenting.instructions.md`:
- ✅ Code is self-explanatory through good naming
- ✅ Comments explain WHY, not WHAT
- ✅ Complex logic has explanatory comments
- ✅ No obvious or redundant comments
- ✅ No commented-out code

#### TypeScript Guidelines (from `.github/instructions/typescript-5-es2022.instructions.md`):
- ✅ Strict mode enabled and followed
- ✅ Proper type annotations on function parameters and returns
- ✅ No use of `any` type
- ✅ Interfaces and types are properly defined
- ✅ Null/undefined handled explicitly

#### Vue 3 Guidelines (from `.github/instructions/vuejs3.instructions.md`):
- ✅ Composition API used consistently
- ✅ Composables follow naming convention (`use-*`)
- ✅ Reactive state properly defined
- ✅ Props and emits properly typed
- ✅ Template syntax follows best practices

### Testing Quality

#### Vitest Guidelines (from `.github/instructions/nodejs-javascript-vitest.instructions.md`):
- ✅ Test names are descriptive (explain what is tested)
- ✅ Tests follow Arrange-Act-Assert pattern
- ✅ Tests are independent (no shared state)
- ✅ Use specific assertions (not just `toBeTruthy()`)
- ✅ Mock external dependencies appropriately
- ✅ Edge cases are covered

---

## Implementation Order Summary

### Phase 1: Types (30 minutes)
1. Create `types/models.ts`
2. Verify types with `npx tsc --noEmit`

### Phase 2: Backend (2-3 hours)
1. Write integration tests for `server/api/models.get.ts` (RED)
2. Implement server route (GREEN)
3. Refactor server route (REFACTOR)
4. Verify all integration tests pass

### Phase 3: Composable (1-2 hours)
1. Write unit tests for `app/composables/use-models-state.ts` (RED)
2. Implement composable (GREEN)
3. Refactor composable (REFACTOR)
4. Verify all unit tests pass

### Phase 4: UI Integration (2-3 hours)
1. Write component tests for models section in `app/app.vue` (RED)
2. Implement UI section in `app/app.vue` (GREEN)
3. Refactor UI (REFACTOR)
4. Verify all component tests pass

### Phase 5: E2E (1-2 hours)
1. Write E2E tests (RED)
2. Ensure E2E tests pass (GREEN)
3. Refactor E2E tests (REFACTOR)
4. Verify test stability

### Phase 6: Cross-Cutting (1-2 hours)
1. Security review
2. Accessibility review
3. Documentation updates

### Phase 7: Quality (1 hour)
1. Code review against guidelines
2. Testing quality review
3. Final cleanup

**Total Estimated Time**: 8-14 hours

---

## Test Execution Strategy

### Running Tests During Development

```bash
# Unit tests only (fast feedback)
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests (slower, run less frequently)
npm run test:e2e

# All tests
npm test

# Watch mode for active development
npm run test:unit -- --watch

# Run specific test file
npm run test:unit tests/unit/models-list.test.ts

# Coverage report
npm run test:coverage
```

### Test Coverage Goals

- **Unit Tests**: 100% coverage for composables and utilities
- **Integration Tests**: 100% coverage for API routes
- **E2E Tests**: Cover happy path and critical error scenarios

### Continuous Integration

Tests will run automatically on:
- Every commit (via pre-commit hook if configured)
- Every pull request (via CI/CD pipeline)
- Before deployment

---

## Rollback Strategy

If issues are discovered after deployment:

1. **Feature Flag**: Consider adding a feature flag to disable models section
2. **Git Revert**: All changes are in isolated files, easy to revert
3. **Fallback**: Error state provides graceful degradation (app still usable)

---

## Success Criteria

### Functional Requirements
- ✅ Models list fetches on app mount
- ✅ Loading spinner displays during fetch
- ✅ Models list displays on success
- ✅ Error message displays on failure
- ✅ Layout matches specification diagram

### Non-Functional Requirements
- ✅ All tests pass (unit, integration, E2E)
- ✅ TypeScript compilation succeeds with no errors
- ✅ Code follows all project guidelines
- ✅ Documentation is updated
- ✅ Accessibility requirements met (WCAG 2.2 Level AA)
- ✅ Security requirements met (no exposed secrets)

### Quality Metrics
- ✅ Test coverage > 80% overall
- ✅ No TypeScript `any` types
- ✅ No ESLint errors or warnings
- ✅ Page load time impact < 500ms
- ✅ E2E tests are stable (no flakiness)

---

## Notes and Considerations

### Design Decisions

1. **Composable Auto-Fetch**: Fetch models immediately on composable init, not on component mount. This ensures data is ready when component renders.

2. **Error Handling**: Follow existing pattern from `respond.post.ts` for consistency. Include both message and details for debugging.

3. **Type Transformation**: Remove `object` field from individual models per specification, but keep it in the root response for validation.

4. **Timeout**: Use default fetch timeout, or match timeout used in `respond.post.ts` for consistency.

5. **Caching**: No caching in initial implementation. Models list doesn't change frequently, so consider adding cache-control headers in future iteration.

### Future Enhancements (Out of Scope)

- Retry button in error state
- Model filtering/search functionality
- Model selection for chat (requires chat integration)
- Periodic refresh of models list
- Caching layer for models data
- Optimistic loading (show cached data while fetching)

### Risk Mitigation

1. **API Key Missing**: Server route returns 500 with clear message
2. **Network Failure**: Error state displays gracefully
3. **Slow API**: Loading state provides user feedback
4. **Malformed Response**: Try-catch and validation prevent crashes
5. **Race Conditions**: State management handles concurrent requests

---

## Appendix: File Structure

```
call-openai-api/
├── .github/
│   ├── implementation-plans/
│   │   └── implementation-plan-to-query-for-openai-models.md (this file)
│   ├── instructions/
│   │   ├── a11y.instructions.md
│   │   ├── code-review-generic.instructions.md
│   │   ├── security-and-owasp.instructions.md
│   │   └── ...
│   └── specs/
│       └── application-specifications-query-for-openai-models.md
├── app/
│   ├── composables/
│   │   ├── use-models-state.ts (NEW)
│   │   └── use-request-state.ts
│   ├── app.vue (UPDATE)
│   └── ...
├── server/
│   └── api/
│       ├── models.get.ts (NEW)
│       └── respond.post.ts
├── tests/
│   ├── e2e/
│   │   ├── models.spec.ts (NEW)
│   │   └── app.spec.ts
│   ├── integration/
│   │   ├── models.test.ts (NEW)
│   │   └── respond-route.test.ts
│   └── unit/
│       ├── models-list.test.ts (NEW)
│       ├── app.models-section.test.ts (NEW)
│       └── ...
├── types/
│   ├── models.ts (NEW)
│   └── chat.ts
└── ...
```

---

## Summary

This implementation plan follows a strict TDD approach with red-green-refactor cycles at each layer. Starting with type definitions, we build from the backend API route through to the frontend UI, testing at each step. The plan incorporates all project guidelines for security, accessibility, code quality, and documentation. Estimated completion time is 8-14 hours with comprehensive test coverage and quality assurance.

**Next Steps**: Begin with Phase 1 (Type Definitions) and proceed sequentially through each phase, running tests frequently to ensure quality at every step.
