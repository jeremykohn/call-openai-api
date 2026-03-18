# Filter Models By Config

## Prompt 1: Create a spec file

Create a clear, detailed spec for adding the following feature to this repo:

- Use a config file to set the models in the UI's dropdown menu, as described below in the "Feature Details" section.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

Save the spec to `.github/specs/filter-models-by-config.md`.

### Feature Details

The config file name is `openai-models.json`.

If the config file exists, and it can be read without errors, and its format is valid, the UI's dropdown menu should display the models retrieved from the OpenAI Models API, except for the models that are listed under "models-with-error" or "models-with-no-response" in the config file.

Otherwise, the dropdown menu should display all models retrieved from the OpenAI Models API, and the UI should display a message "Note: List of OpenAI models may include some older models that are no longer available."

In any case, the model names in the dropdown menu should be displayed in alphabetical order.

The config file format is as follows, in which placeholders such as `<model-name>` are in place of the actual model names:

```
{
  "models-with-error": [
    "<model-name-1>",
    "<model-name-2>"
  ],
  "models-with-no-response": [
    "<model-name-3>",
    "<model-name-4>"
  ],
  "other-models": [
    "<model-name-5>",
    "<model-name-6>"
  ]
}
```

A sample config file should be included, at `openai-models.json.example`, as follows:

```
{
  "models-with-error": [
    "babbage-002",
    "chatgpt-image-latest"
  ],
  "models-with-no-response": [
    "gpt-3.5-turbo-instruct"
  ],
  "other-models": [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-5.4"
  ]
}
```

## Prompt 2: Create implementation plan with tasks

Create an implementation plan to make the changes that are described in `.github/specs/filter-models-by-config.md`.

Ignore the implementation plan that exists at `.github/specs/prev-filter-models-by-config.md`.

If anything is vague, unclear, or ambiguous, pause and ask me for guidance before you continue.

The implementation plan should use Test-Driven Development (TDD) including unit tests, integration tests, and end-to-end tests, with a red-green-refactor loop for writing tests and testing code.

In each phase of the implementation plan, describe the approach you will take in detail, and include a list of tasks to implement that phase of the plan. Make sure the tasks are small, specific, independently testable, and ordered by dependency.

Don't write any code yet.

Save the implementation plan to a new file `.github/implementation-plans-with-tasks/filter-models-by-config.md`.

## Prompt 3: Implement plan and tasks

Start implementing the plan and tasks from `.github/implementation-plans-with-tasks/filter-models-by-config.md`.

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
