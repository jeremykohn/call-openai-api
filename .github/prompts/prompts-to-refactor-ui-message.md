# Refactor UI message

## Prompt 1: Create a spec file

Create a clear, detailed spec for making the following change:

Refactor the code so that the message text "Note: List of OpenAI models may include some older models that are no longer available." is assigned to a constant, instead of being hard-coded in multiple files.

This message text appears in these files, and possibly other files as well:
- README.md
- ModelsSelector.vue
- models-selector.spec.ts
- rendering.test.ts

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

Save the spec to `.github/specs/refactor-ui-message.md`.

## Prompt 2: Create implementation plan with tasks

Create an implementation plan to make the changes that are described in `.github/specs/refactor-ui-message.md`.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

The implementation plan should use Test-Driven Development (TDD) including unit tests, integration tests, and end-to-end tests, with a red-green-refactor loop for writing tests and testing code.

In each phase of the implementation plan, describe the approach you will take in detail, and include a list of tasks to implement that phase of the plan. Make sure the tasks are small, specific, independently testable, and ordered by dependency.

Don't write any code yet.

Save the implementation plan to a new file `.github/implementation-plans-with-tasks/refactor-ui-message.md`.

## Prompt 3: Implement plan and tasks

Start implementing the plan and tasks from `.github/implementation-plans-with-tasks/refactor-ui-message.md`.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

After each phase is complete, check the newly modified files for problems, propose how to fix the problems, and implement the proposed fixes.

After all phases are complete, check all modified files for problems, propose how to fix the problems, and implement the proposed fixes.

Finally, run prettier to format all .ts and .vue files that were modified.

---

## Manual Steps

- **Incremental commits:** After each phase (or even after each task), make a commit so progress is trackable and rollback is possible if needed.
- **CI/CD integration:** Run the full test suite on each commit to catch issues early.
- **Code review:** Each phase should be reviewable as a cohesive set of changes before moving to the next phase.
- **Monitoring:** After deployment, monitor for any unexpected behavior or errors in production (e.g., models that fail at response time due to upstream constraints).
