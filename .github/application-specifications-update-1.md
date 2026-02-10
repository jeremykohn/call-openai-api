# Application Specification: Tailwind CSS Integration + UI Refresh

## Summary
Integrate Tailwind CSS into the Nuxt build and use it to refresh the UI styling across the app. The goal is a clean, modern, accessible interface that improves visual hierarchy, spacing, and component polish while preserving current functionality.

## Goals
- Add Tailwind CSS to the Nuxt build pipeline.
- Replace or augment existing CSS with Tailwind utility classes.
- Improve the visual design of the header, form, buttons, status panels, and footer.
- Maintain existing behavior, layout structure, and API interactions.

## Non-Goals
- No functional changes to server routes or API logic.
- No new runtime dependencies beyond Tailwind and required tooling.
- No redesign of app flow or new features.

## UX and Visual Requirements
- Create a polished, modern layout with clear spacing and typographic hierarchy.
- Ensure interactive elements are visually distinct and have hover/focus states.
- Improve the status section styling for success and error states.
- Keep the layout responsive for common viewport sizes.

## Accessibility Requirements
- Maintain visible focus styles for all interactive elements.
- Ensure sufficient color contrast for text and controls.
- Preserve semantic headings and landmarks.
- Keep form labels explicitly associated with inputs.

## Technical Requirements
### Tailwind Integration
- Add Tailwind CSS and its Nuxt integration (`@tailwindcss` + `@nuxtjs/tailwindcss`).
- Ensure Tailwind is configured for the Nuxt app directory structure.
- Enable JIT and content scanning for `app/`, `components/`, `layouts/`, `pages/`, and `server/` as needed.
- Preserve any existing global styles that are still needed.

### Styling Updates
- Convert the main layout to Tailwind utilities, including:
  - Header block (title + subtitle)
  - Form label, textarea, and submit button
  - Status container for loading/success/error
  - Footer text and links
- Use Tailwind to implement:
  - Consistent spacing scale
  - Responsive max-width container
  - Elevated cards/panels for response and error sections
  - Button styling with hover/focus/disabled states

## Component-Level Styling Guidance
- **Header**: center-aligned, strong heading, muted subtitle, optional soft background or border.
- **Form**: structured label + input with clear focus ring, subtle shadow or border.
- **Primary button**: bold, high-contrast, rounded, with hover/active states.
- **Status panel**: distinct visual states:
  - Loading: subtle neutral background
  - Success: soft green background + border
  - Error: soft red background + border
- **Response text**: normal with `whitespace-pre-wrap`.
- **Footer**: smaller text, muted color, link hover state.

## File Targets
- `app/app.vue` (primary layout and component classes)
- `app/assets/main.css` (retain only minimal global styles if needed)
- `nuxt.config.ts` (Tailwind module integration)
- `package.json` (Tailwind dependencies/scripts)
- `tailwind.config.ts` / `tailwind.config.js` (if needed by module)

## Acceptance Criteria
- Tailwind CSS is configured and applied across the app.
- Visual appearance is modern, consistent, and clearly improved.
- UI is responsive and readable on mobile and desktop.
- Accessibility requirements are met (focus visibility, contrast, labels).
- No breaking changes to functionality or tests.

## Validation
- Run unit/integration/e2e tests if changes affect UI snapshots or selectors.
- Manually verify layout at common widths (mobile, tablet, desktop).

## Rollout Notes
- Keep changes minimal and scoped to styling.
- Prefer updating existing class names rather than introducing new components.