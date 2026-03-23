# Prompt 1

Generate a specification for making the following changes to the Nuxt app in this repo:

- Remove the filtering of models for the dropdown menu. The dropdown menu should include all models from the OpenAI Models API.
- Remove the verification of each model's capability.

If you are not sure how to write this specification, ask me for guidance.

Save the specification to a new file, .github/specs/application-specifications-remove-model-filtering.md. Don't modify or replace any existing files.

# Prompt 2

Create an implementation plan to make the changes that are described in .github/specs/application-specifications-remove-model-filtering.md.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

The implementation plan should use Test-Driven Development (TDD) including unit tests, integration tests, and end-to-end tests, with a red-green-refactor loop for writing tests and testing code.

In each phase of the implementation plan, describe the approach you will take in detail, and include a list of tasks to implement that phase of the plan. Make sure the tasks are small, specific, independently testable, and ordered by dependency.

Don't write any code yet.

Save the implementation plan to a new file .github/implementation-plans-with-tasks/implementation-plan-with-tasks-remove-model-filtering.md.

# Prompt 3

Start implementing the tasks from .github/implementation-plans-with-tasks/implementation-plan-with-tasks-remove-model-filtering.md.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

After each phase is complete, check the newly modified files for problems, propose how to fix the problems, and implement the proposed fixes.

After all phases are complete, check all modified files for problems, propose how to fix the problems, and implement the proposed fixes.

Finally, run prettier to format all modified files.

---

## Manual Steps

- **Incremental commits:** After each phase (or even after each task), make a commit so progress is trackable and rollback is possible if needed.
- **CI/CD integration:** Run the full test suite on each commit to catch issues early.
- **Code review:** Each phase should be reviewable as a cohesive set of changes before moving to the next phase.
- **Monitoring:** After deployment, monitor for any unexpected behavior or errors in production (e.g., models that fail at response time due to upstream constraints).
