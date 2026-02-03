# Copilot Instructions

Project-specific guidance for GitHub Copilot. Keep this file updated as the codebase evolves.

## Project Overview
- **Name**: Call OpenAI API
- **Purpose**: Simple app that sends a user prompt to the OpenAI Responses API, shows progress while waiting, and displays the response.
- **Primary Language(s)**: TypeScript, JavaScript
- **Runtime/Framework**: Node.js, Nuxt 4, Vue 3
- **Target Environment**: Vercel

## Repo Structure
- **Entry Points**: <paths>
- **Key Modules**: <paths>
- **Generated Code**: <paths or patterns>
- **Third-Party Code**: <paths>

## Build, Run, Test
- **Install**:
  - `<command>`
- **Run**:
  - `<command>`
- **Test**:
  - `<command>`
- **Lint/Format**:
  - `<command>`

## Coding Standards
- **Style Guide**: <link or brief summary>
- **Naming**: <rules>
- **Error Handling**: <rules>
- **Logging**: <rules>
- **Performance Considerations**: <rules>

## API & Data Contracts
- **Public APIs**: OpenAI Responses API
- **Schemas**: <paths>
- **Backward Compatibility**: <rules>

## Security & Compliance
- **Secrets Handling**: Store the OpenAI API key in a local `.env` file; ensure it is excluded from git via `.gitignore`.
- **Input Validation**: <rules>
- **Dependencies**: <approval rules>

## Documentation
- **Docs Location**: <paths>
- **Changelog**: <path>
- **Examples**: <path>

## Workflow Preferences
- **Branching**: <model>
- **Commit Style**: <rules>
- **PR Checklist**:
  - <item>

## Copilot Behavior Preferences
- **Do**: Prefer Nuxt 4 + Vue 3 idioms, Composition API, and TypeScript types.
- **Do**: Keep OpenAI Responses API calls in server routes or server utilities.
- **Do**: Show a loading/progress UI state while awaiting responses.
- **Do**: Use `runtimeConfig` for secrets; read `OPENAI_API_KEY` from `.env`.
- **Do**: Keep UI minimal and accessible; include clear error states for failed calls.
- **Avoid**: Exposing secrets in client code or logs.
- **Avoid**: Adding heavy dependencies unless necessary.
- **Testing**: Use Vitest for unit tests; prefer targeted tests for new logic.
- **Tooling**: Use Nuxt CLI and Vite defaults unless otherwise specified.

## Notes for This Repo
- <any repo-specific guidance>
