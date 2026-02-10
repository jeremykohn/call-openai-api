# Implementation Plan: Tailwind CSS Integration + UI Refresh (TDD)

## Overview
This plan implements the Tailwind CSS integration and UI refresh described in `application-specifications-update-1.md` using a test-driven workflow. The approach focuses on adding Tailwind to Nuxt, migrating UI styles to utilities, and validating behavior with unit, integration, and end-to-end tests.

## Guiding Principles
- Use **red → green → refactor** loops for test updates.
- Preserve current app behavior and accessibility.
- Keep styling changes scoped to the specified UI areas.

## Instructions for Red-Green-Refactor Loops
- At the end of each "red" step:
    - Run all newly added tests and all newly updated tests to confirm that they fail. If any tests pass, display a notice and pause execution.
- At the end of each "green" step and at the end of each "refactor" step:
    - Run the full test suite (unit, integration, and e2e tests) to confirm that all tests pass. If any tests fail, display a notice and pause execution.

## Phase 1: Baseline + Test Readiness
1. **Establish baseline**
   - Run current unit, integration, and e2e tests to confirm the starting point.
   - Note any selectors or text assertions that will be impacted by CSS-class changes.

2. **Identify test touchpoints**
   - Unit tests that verify visible text or state rendering.
   - E2E tests that rely on text, roles, labels, or CSS-driven layout assumptions.

## Phase 2: Tailwind Integration (Red → Green → Refactor)
### Red
- Add a minimal test to ensure the app renders with Tailwind’s base styles applied (e.g., a snapshot or DOM check confirming that Tailwind classes exist in the main layout).

### Green
- Install Tailwind and Nuxt integration with the recommended module (`@nuxtjs/tailwindcss`).
- Update `nuxt.config.ts` to register the Tailwind module.
- Add Tailwind config file and ensure content scanning includes `app/`, `components/`, `layouts/`, `pages/`, and `server/` where appropriate.
- Add Tailwind directives to the main stylesheet, retaining only minimal custom CSS as needed.

### Refactor
- Remove redundant custom CSS that is now covered by Tailwind utilities.
- Confirm existing styles for focus outlines and accessibility are preserved or improved.

## Phase 3: UI Styling Updates (Red → Green → Refactor)
### Red
- Update or add unit/e2e tests to assert the presence of expected content and UI states without relying on old CSS class names.
- If any tests depended on old classes, update them to use accessible selectors (`role`, `label`, `text`).

### Green
- Apply Tailwind utility classes to:
  - Header (title + subtitle)
  - Form label + textarea + button
  - Status container (loading/success/error)
  - Footer text + links
- Implement the styling guidance from the specification:
  - Responsive container + spacing scale
  - Distinct button styles with hover/focus/active states
  - Panels with subtle borders/shadows for success/error states
  - Response text set to normal type with `whitespace-pre-wrap`

### Refactor
- Consolidate repeated Tailwind class groups with component-level structures if needed.
- Re-evaluate any remaining custom CSS and remove unused rules.

## Phase 4: Accessibility Validation (Red → Green → Refactor)
### Red
- Add unit/e2e checks for visible focus states on key controls (button, textarea, links).

### Green
- Ensure focus rings remain visible and color contrast stays compliant.
- Keep semantic structure (header, main, footer) intact.

### Refactor
- Remove any redundant accessibility overrides or styles.

## Phase 5: Test Verification
- Run the full test suite:
  - `test:unit`
  - `test:integration`
  - `test:e2e`
- Address any test failures introduced by selector or UI changes.

## Deliverables
- Tailwind configured with Nuxt integration.
- UI fully restyled with Tailwind utilities.
- Tests updated to remain stable and aligned with the new styling.
- Minimal custom CSS retained only where necessary.

## Acceptance Criteria Mapping
- Tailwind integrated and applied across the app.
- Visual refresh aligned with spec (header, form, status panels, footer).
- Responsive layout verified at common breakpoints.
- Accessibility requirements validated via tests and manual checks.
- All tests green.
