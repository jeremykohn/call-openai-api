# Call OpenAI API

A simple Nuxt 4 app that sends a prompt to the OpenAI Responses API, shows a loading state, and renders the response.

Notes:

- Prompts are limited to 4000 characters.
- The model dropdown is sourced from OpenAI models and may be filtered by local config.

## Model list behavior

- The server route `GET /api/models` proxies OpenAI's models API, then applies optional config-driven filtering from `server/assets/models/openai-models.json`.
- A sample config file is provided at `server/assets/models/openai-models.json.example`.
- In config-valid mode, models listed in `models-with-error` and `models-with-no-response` are excluded from the dropdown.
- In fallback mode (missing, unreadable, malformed, or invalid config), the dropdown includes the full upstream list and displays: `Note: List of OpenAI models may include some older models that are no longer available.`
- The dropdown model list is sorted alphabetically in both config-valid and fallback modes.
- The route still enforces OpenAI configuration and allowed-host security checks before returning data.
- Model list responses are cached in server memory and may be served from cache when available.
- Submit-time validation accepts any selected model that exists in the fetched models list.

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
