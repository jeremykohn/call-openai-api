# Call OpenAI API

A simple Nuxt 4 app that sends a prompt to the OpenAI Responses API, shows a loading state, and renders the response.

Notes:

- Prompts are limited to 4000 characters.
- The model dropdown only shows models compatible with the OpenAI Responses API (for example, transcription-only models are filtered out).

## Model compatibility filtering

- The server discovers candidate models from OpenAI's models API and verifies Responses API compatibility using lightweight probe requests.
- Probe requests use a fixed minimal payload (`input: "a"`, `max_output_tokens: 16`) with a 2-second timeout.
- Compatibility results are cached in server memory for 24 hours.
- Stale cache entries are returned immediately and refreshed asynchronously in the background.
- Manual overrides are read from `server/config/allowed-models-overrides.json` with this schema:

```json
{
  "allowed_models": [],
  "disallowed_models": []
}
```

- Models with unknown capability are returned with `capabilityUnverified: true` and shown in the selector with an "Availability unverified" caveat.
- Submitting an unverified-capability model returns a user-facing validation error.

## Error handling behavior

The app normalizes request failures into consistent UI-facing categories:

- `network`: shown when OpenAI cannot be reached. The message includes actionable guidance to check connectivity and retry.
- `api`: shown when OpenAI returns an API error payload. The UI message is sanitized and technical details are available behind an optional details toggle.
- `unknown`: shown for unexpected failures that do not match network/API patterns.

Error details are hidden by default when a details toggle is present (`Show details` / `Hide details`).
This keeps error UI safe by default while still allowing debug context when needed.

## Accessibility

- Error messages are announced through `role="alert"` semantics.
- Error controls (details toggle and retry button) are keyboard operable.
- Error state checks are covered by unit and end-to-end accessibility tests.

## Prerequisites

- Node.js 20+
- An OpenAI API key

## Setup

1. Create a local environment file:

```bash
cp .env.example .env
```

2. Add your API key to `.env`:

```bash
OPENAI_API_KEY=your_key_here
```

Optional (for local testing or proxies):

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ALLOWED_HOSTS=api.openai.com
```

3. Install dependencies:

```bash
npm install
```

## Run the app

```bash
npm run dev
```

## Tests

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:a11y:unit
npm run test:a11y:e2e
```

If Playwright reports missing system dependencies, install them with:

```bash
sudo npx playwright install-deps
```

## Deployment

- Deploy to Vercel using the Nuxt preset.
- Configure `OPENAI_API_KEY` in your Vercel environment variables.
