Create a clear, implementation-ready spec for this entire repository.

The spec must be fully standalone: someone with only the spec should be able to rebuild the app with the same features, behavior, API contracts, UX flow, and the same UI layout/styling.

## Instructions
1. Analyze the full repo (`app/`, `server/`, `shared/`, config files, tests, scripts, docs).
2. Write a single Markdown spec with enough detail to implement equivalent functionality and visuals from scratch.
3. Include:
   - Product purpose and user flow
   - Functional requirements (numbered, explicit)
   - Non-functional requirements
   - Architecture and module responsibilities
   - API routes, request/response schemas, validation rules, error behavior
   - UI structure, component behavior, all UI states, interaction details
   - Styling/design-system details (layout, spacing, typography, colors, responsive behavior)
   - State management/client logic
   - Security and accessibility requirements
   - Environment/config requirements (`.env`, runtime config)
   - Setup/run/test commands and usage steps
   - Acceptance criteria for functional and visual parity
4. Use concrete file paths and exact behavior; avoid vague language.
5. If there are conflicts or ambiguities, list them explicitly and propose a default.

## Critical Rule
If anything is vague, unclear, or ambiguous, pause and ask clarifying questions before continuing. Do not guess.

## Output Requirements
- Output only the final spec content (no meta commentary).
- Keep it structured with clear headings and tables where helpful.
- Ensure internal consistency and implementation-level detail.
