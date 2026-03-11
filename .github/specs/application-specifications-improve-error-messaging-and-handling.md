# Application Specification: Improve Error Messaging and Handling for OpenAI API Failures

## Objective
Enhance user-facing error messages and handling for OpenAI API failures to provide clear, actionable, and accessible feedback. Distinguish between network errors, API errors, and unknown errors, and ensure all error states are accessible and informative.

## Scope
- Applies to all UI components and server logic that display or process errors from OpenAI API requests.
- Covers error handling for:
  - Network errors (e.g., connection lost, timeout)
  - OpenAI API errors (e.g., invalid API key, quota exceeded, model not found)
  - Unknown or unexpected errors

## Requirements

### 1. Error Categorization
- Detect and categorize errors as:
  - Network errors (using `isNetworkFetchError`)
  - OpenAI API errors (using `isApiError`)
  - Unknown errors

### 2. User-Facing Messaging
- Display clear, actionable error messages for each category:
  - **Network Error:** "Network error: Unable to reach OpenAI. Please check your internet connection and try again."
  - **API Error:** Show the specific error message from OpenAI, e.g., "Invalid API key. Please check your key and try again."
  - **Unknown Error:** "An unexpected error occurred. Please try again or contact support."
- Avoid technical jargon unless necessary for troubleshooting.
- Provide guidance or next steps where possible.

### 3. Accessibility
- All error messages must be accessible:
  - Use ARIA roles (e.g., `role="alert"`) for error notifications.
  - Ensure error messages are readable by screen readers and keyboard navigable.
  - Use sufficient color contrast and avoid color-only cues.

### 4. UI Consistency
- Error messages should be visually distinct and consistent across the app.
- Use a standard error component or pattern for displaying errors.

### 5. Logging and Debugging
- Log errors with sufficient detail for debugging, but avoid exposing sensitive information in the UI.
- Optionally provide a "Show details" link for advanced users to view technical error info.

### 6. Testing
- Add unit and integration tests for error display logic.
- Test all error categories and ensure correct messaging and accessibility.

## Acceptance Criteria
- All error states are categorized and displayed with clear, accessible messages.
- UI is consistent and meets accessibility standards (WCAG 2.2 AA).
- Tests cover all error scenarios and verify correct messaging and accessibility.

## Out of Scope
- Changes to OpenAI API request logic unless required for error handling.
- Non-error UI improvements.

## References
- [WCAG 2.2 Accessibility Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Copilot Instructions: Accessibility, Error Handling](../instructions/a11y.instructions.md)
- [Type Guard Utilities](../../app/utils/type-guards.ts)

---
**Last updated:** March 10, 2026
