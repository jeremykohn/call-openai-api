# Call OpenAI API

A simple Nuxt 4 app that sends a prompt to the OpenAI Responses API, shows a loading state, and renders the response.

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
```

If Playwright reports missing system dependencies, install them with:

```bash
sudo npx playwright install-deps
```

## Deployment
- Deploy to Vercel using the Nuxt preset.
- Configure `OPENAI_API_KEY` in your Vercel environment variables.
