(Prompt to ask for ambiguities)

Read .github/implementation-plans-with-tasks/implementation-plan-with-tasks-to-improve-model-filtering.md. If anything in that file is vague, unclear, or ambiguous, ask me for clarifications.

--------------

(Prompt to respond to ambiguities)

Here are the clarifications.

## Phase 1
1. Capability state should be persisted in the browser's local storage. 
2. The cache TTL should be 24 hours, and not configurable. 
3. Manual allow/deny lists should be loaded from a config file.

## Phase 2
4. Use a hardcoded minimum-length input, and the minimum value for max_tokens. 
5. The number of concurrent probes should be unbounded. 
6. The probe timeout should be 10 seconds.

## Phase 3
7. When cache is stale, the route should return stale data and trigger async refresh in the background.
8. `unknown` capability models should be included with a caveat.

## Phase 4
9. When selected model is unsupported, return a user-facing error.

## Phases 5-6
10. Discovery/probe/cache events should be logged at `info`. Metrics should go to stdout/stderr.

Use these clarifications to update .github/implementation-plans-with-tasks/implementation-plan-with-tasks-to-improve-model-filtering.md.
