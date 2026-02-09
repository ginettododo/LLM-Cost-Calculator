# Token & LLM Cost Calculator

A fully static, privacy-first calculator for estimating token usage and cost across LLM providers. The app runs entirely in the browser with local pricing data.

## Runtime Constraints
- Static frontend only (Vite + React)
- No backend or serverless runtime
- No databases
- No paid APIs
- No token-count API calls

## Local Development

```bash
npm install
npm run dev
```

## Quality Commands

```bash
npm run test
npm run test:smoke
npm run lint
npm run build
```

## Pricing Data Workflow
Pricing data is stored in `src/data/prices.json` and bundled at build time.

Local maintenance commands:

```bash
npm run prices:update
npm run prices:validate
```

- `prices:update`: conservative canonicalization pass (sort/normalize + staleness warning)
- `prices:validate`: strict schema validation (fails non-zero on any schema issue)

Scheduled GitHub Action:
- Workflow: `.github/workflows/pricing-update.yml`
- Trigger: weekly (Monday 06:00 UTC) + manual dispatch
- Behavior:
  1. run `prices:update`
  2. run `prices:validate`
  3. commit `src/data/prices.json` if it changed

No secrets are required beyond the default `GITHUB_TOKEN`.

## Vercel Static Deployment
This project deploys to Vercel as a static site with no server runtime.

1. Import the repository in Vercel.
2. Configure project settings:
   - Framework Preset: `Vite`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deploy.

Notes:
- `vite.config.ts` explicitly uses SPA app type and `dist` output.
- `vercel.json` is not required for the current single-route app.

## UX Features
- Live counters: characters, words, lines, UTF-8 bytes
- OpenAI exact tokenization (local tokenizer) with fallback estimation for other providers
- Large-input guardrail: warning for inputs over 50k chars
- Compute mode toggle: `Primary model only` to keep large-input updates responsive
- Export current table to CSV/JSON
- Copy summary to clipboard
- Presets for quick testing
- Light/Dark mode toggle

## Data Export Format

### CSV columns
- `timestamp`
- `characters`
- `words`
- `lines`
- `bytes`
- `last_updated`
- `provider`
- `model`
- `exactness`
- `tokens`
- `input_cost_usd`
- `output_cost_usd`
- `total_cost_usd`
- `price_input_per_mtok`
- `price_output_per_mtok`

### JSON shape
- `metadata`: `timestamp`, counters, `last_updated`
- `rows`: visible computed rows with pricing + token fields
