Write a complete, clear, and detailed **source specification** for this repository so that, with no additional context, a coder or coding agent can rebuild the same application with the same behavior, UX flow, UI layout, and styling.

Save the source specification to `.github/spec/spec-for-entire-repo-v2.md`.

## Goal
Produce a **single standalone spec document** that captures:
- The app’s purpose and user value
- All implemented functionality and requirements
- All API behavior and data contracts
- The full UI structure, states, and styling system
- Setup, run, test, and verification instructions
- Security, accessibility, and operational constraints

The spec must be detailed enough that an engineer could implement an equivalent app from scratch and achieve functionally and visually matching results.

---

## Critical Process Requirement
If anything is vague, unclear, or ambiguous at any point, **pause and ask clarifying questions before continuing**. Do not guess.

---

## Scope of Analysis (read these before writing)
Analyze the repository comprehensively, including:
- App source (`app/`, `server/`, `shared/`, config files)
- UI components, composables, and styling (`.vue`, Tailwind config, CSS, tokens)
- API/server routes, utilities, validation, error handling, and runtime config
- Tests (unit, integration, e2e, accessibility)
- Scripts and automation under `.github/` and project scripts in `package.json`
- Documentation and instruction files that define expected behavior

When behavior differs across files, call it out explicitly and resolve in the spec with a clear canonical rule.

---

## Required Output Format
Write the output as a Markdown file with these exact top-level sections:

1. `# Product Overview`
2. `# Functional Requirements`
3. `# Non-Functional Requirements`
4. `# System Architecture`
5. `# API and Data Contracts`
6. `# UI/UX Specification`
7. `# Styling and Design System`
8. `# State Management and Client Logic`
9. `# Error Handling and Empty States`
10. `# Security Requirements`
11. `# Accessibility Requirements`
12. `# Configuration and Environment`
13. `# Setup, Run, and Usage`
14. `# Testing and Quality Gates`
15. `# Acceptance Criteria`
16. `# Open Questions / Ambiguities`

Do not omit sections. If a section has no content, explain why.

---

## Content Requirements by Section

### 1) Product Overview
- App name, problem solved, primary user flow
- What the app does end-to-end from user input to response display

### 2) Functional Requirements
- Enumerate every user-visible feature as numbered requirements (`FR-001`, etc.)
- Include model selection behavior, request/response flow, loading/progress behavior, fallback behavior, and failure handling
- Include server-side behavior and config-driven behavior

### 3) Non-Functional Requirements
- Performance expectations, reliability, deterministic behavior, logging constraints
- Maintainability constraints and dependency constraints

### 4) System Architecture
- High-level architecture (Nuxt app layers, server routes/utilities, shared modules)
- Important directories and responsibilities
- Request lifecycle sequence (client -> server -> OpenAI -> server -> UI)

### 5) API and Data Contracts
- Every relevant endpoint: method, path, request shape, response shape, status codes
- Include model/config schema details and validation rules
- Include canonical JSON key ordering and any deterministic serialization rules

### 6) UI/UX Specification
- Page structure and information architecture
- Component tree and responsibilities
- All UI states: idle, loading, success, error, unavailable models, no response
- Interaction details (focus behavior, disabled states, announcements, etc.)

### 7) Styling and Design System
- Tailwind usage, spacing/typography/color patterns
- Responsive behavior and breakpoints
- Visual hierarchy and layout constraints
- Define what must match visually for parity

### 8) State Management and Client Logic
- Local/component/composable state responsibilities
- Data flow between composables/components/routes
- Caching/debouncing/retry logic if present

### 9) Error Handling and Empty States
- Error taxonomy (validation, server, upstream API, no-response)
- Sanitization/normalization expectations
- User-facing error content and behavior requirements

### 10) Security Requirements
- Secret handling (`runtimeConfig`, `.env`, server-only boundaries)
- Input validation and safe defaults
- Logging restrictions (no secret leakage)

### 11) Accessibility Requirements
- Keyboard navigation requirements
- Labeling, semantics, and focus management
- WCAG-oriented color contrast and error communication expectations

### 12) Configuration and Environment
- Required env vars and defaults
- Runtime config mapping and where each value is used
- Config files consumed at runtime and expected schema

### 13) Setup, Run, and Usage
- Prerequisites
- Install, develop, test, and production run commands
- Example `.env` template and expected behavior if values are missing

### 14) Testing and Quality Gates
- Existing test layers (unit/integration/e2e/a11y)
- What each test layer validates
- Minimum checks required before merge

### 15) Acceptance Criteria
- Provide a checklist that can verify a fresh implementation matches this repo
- Include both behavioral parity and visual parity criteria

### 16) Open Questions / Ambiguities
- List unresolved or conflicting findings discovered during analysis
- For each: explain impact and propose default decision
- If unresolved blockers remain, stop and ask questions

---

## Spec Quality Rules
- Be explicit and implementation-ready; avoid vague statements
- Use numbered requirements and concrete examples
- Prefer tables for contracts and state matrices
- Distinguish **must-have** vs **nice-to-have**
- Clearly mark assumptions
- Keep the spec internally consistent

---

## Output Constraints
- Output only the final spec content (no meta commentary)
- Do not include placeholders like `<fill me>`
- Do not refer to “current repo” ambiguously; name paths and behavior directly
- Ensure the document is self-contained and can be handed to an engineer as-is

---

## Final Validation Checklist (perform before returning)
Confirm the produced spec:
- Covers all implemented features and user flows
- Includes enough detail to recreate the same UI/layout/styling
- Defines APIs, schemas, error behavior, and environment setup
- Includes setup/run/test instructions that are executable
- Includes acceptance criteria for functional + visual parity
- Explicitly lists ambiguities/questions instead of guessing
