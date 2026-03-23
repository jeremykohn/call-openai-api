# Remove Model Capability Detection

## Prompt 1: Create a spec file

Create a clear, detailed spec for making the following changes to this repo:

- Remove the functionality that detects/discovers/confirms model capability.
- Remove the functionality that caches information about model capability.
- If applicable, remove tests for these functionalities as well.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

Save the spec to `.github/specs/remove-model-capability-detection.md`.

## Prompt 2: Create implementation plan with tasks

Create an implementation plan to make the changes that are described in `.github/specs/remove-model-capability-detection.md`.

To resolve certain ambiguities in the spec:
- `/api/models` response caching is still needed, but it must be implemented as model-list caching, not capability caching.

If anything else is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

The implementation plan should use Test-Driven Development (TDD) including unit tests, integration tests, and end-to-end tests, with a red-green-refactor loop for writing tests and testing code.

In each phase of the implementation plan, describe the approach you will take in detail, and include a list of tasks to implement that phase of the plan. Make sure the tasks are small, specific, independently testable, and ordered by dependency.

Don't write any code yet.

Save the implementation plan to a new file `.github/implementation-plans-with-tasks/remove-model-capability-detection.md`.

## Prompt 3: Implement plan and tasks

Start implementing the tasks from `.github/implementation-plans-with-tasks/remove-model-capability-detection.md`.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

After each phase is complete, check the newly modified files for problems, propose how to fix the problems, and implement the proposed fixes.

After all phases are complete, check all modified files for problems, propose how to fix the problems, and implement the proposed fixes.

Finally, run prettier to format all modified files.