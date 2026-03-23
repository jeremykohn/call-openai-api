# Tasks: Tailwind CSS Integration + UI Refresh

1. **Baseline verification**: Run unit, integration, and e2e tests to capture current status and identify any selectors that may be impacted by styling changes.

2. **Add Tailwind test scaffolding**: Create or update a minimal test to assert Tailwind base styles/classes are present in the rendered app (red step).

3. **Install Tailwind module**: Add `@nuxtjs/tailwindcss` and Tailwind dependencies; update `package.json` and lockfile accordingly (green step).

4. **Configure Tailwind**: Add Tailwind config and content paths to include `app/`, `components/`, `layouts/`, `pages/`, and `server/` (green step).

5. **Integrate Tailwind in Nuxt**: Register the Tailwind module in `nuxt.config.ts` and add Tailwind directives in the main stylesheet (green step).

6. **Refactor global styles**: Remove or simplify redundant CSS in `app/assets/main.css` while preserving focus visibility and accessibility (refactor step).

7. **Update UI tests for selectors**: Adjust unit/e2e tests to use accessible selectors (`role`, `label`, `text`) instead of CSS classes if needed (red step).

8. **Restyle header and layout**: Apply Tailwind utilities to the header and main layout container (green step).

9. **Restyle form controls**: Apply Tailwind utilities to label, textarea, and primary button with hover/focus/disabled states (green step).

10. **Restyle status panels**: Apply Tailwind utilities for loading/success/error states, including borders and background tints (green step).

11. **Restyle response text**: Ensure response text uses normal font styling with `whitespace-pre-wrap` (green step).

12. **Restyle footer**: Apply Tailwind utilities for muted text and accessible link styles (green step).

13. **Accessibility validation**: Add or adjust tests to verify visible focus states and contrast-friendly styling (red/green steps).

14. **Refactor Tailwind classes**: Consolidate repeated class groups and remove any remaining unused CSS (refactor step).

15. **Full test suite**: Run `test:unit`, `test:integration`, and `test:e2e` to confirm all tests pass.
