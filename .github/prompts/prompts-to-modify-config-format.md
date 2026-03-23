# Modifiy Config Format

## Prompt 1: Create a spec file

Create a clear, detailed spec for modifying the format of the type `OpenAIModelsConfig` and the format of the config file `openai-models.json`, as follows:

- The current config format includes the keys "models-with-error", "models-with-no-response", and "other-models".
- Add a key "available-models", whose value is an array of strings.
- Sort the keys alphabetically.
- Keep the behavior of filtering the model names so that the models that are included in "models-with-error" and "models-with-no-response" are not displayed in the UI dropdown.
- Update the existing `openai-models.json` and `openai-models.json.example` to fit the new format.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

Save the spec to `.github/specs/modify-config-format.md`.

## Prompt 2: Create implementation plan with tasks

Create an implementation plan to make the changes that are described in `.github/specs/modify-config-format.md`.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

The implementation plan should use Test-Driven Development (TDD) including unit tests, integration tests, and end-to-end tests, with a red-green-refactor loop for writing tests and testing code.

In each phase of the implementation plan, describe the approach you will take in detail, and include a list of tasks to implement that phase of the plan. Make sure the tasks are small, specific, independently testable, and ordered by dependency.

Don't write any code yet.

Save the implementation plan to a new file `.github/implementation-plans-with-tasks/modify-config-format.md`.

## Prompt 3: Implement plan and tasks

Start implementing the plan and tasks from `.github/implementation-plans-with-tasks/modify-config-format.md`.

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
