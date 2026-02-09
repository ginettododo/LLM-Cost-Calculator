# Token & LLM Cost Calculator

A fully static, privacy-first calculator for estimating token usage and cost across LLM providers. The app runs entirely in the browser with local pricing data—no backend, no databases, no paid APIs, and no LLM calls.

## Constraints
- Fully static site deployable on Vercel.
- No backend, no serverless functions, no database.
- No paid APIs or LLM calls.
- All computation happens in the browser.

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Test & Lint

```bash
npm run test
npm run lint
```

## Deployment (Vercel Static)
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder as a static site on Vercel.
   - Framework preset: **Vite**
   - Output directory: `dist`
   - No serverless functions required.

## Data
Pricing data lives in `src/data/prices.json` and is bundled at build time. Update the JSON file to refresh the pricing table.

## Utility Features
- `Export` menu:
  - Export current visible/computed results to CSV.
  - Export current visible/computed results to JSON.
- `Copy summary` button:
  - Copies a compact multiline summary with counters, primary model snapshot, and top 3 cheapest models by current input cost.
- `Presets` dropdown:
  - Short paragraph
  - Long article (~5k chars)
  - Code sample (JSON)
  - Mixed unicode (emoji + accents)
  - Selecting a preset replaces textarea content and shows an `Undo` toast action.
- Light/Dark mode toggle:
  - Pure CSS class toggle, no persistence.

## Export Format

### CSV
- One spreadsheet-friendly row per currently visible model (after filters/search/exact-only).
- Columns:
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
  - `output_cost_usd` (blank when unavailable)
  - `total_cost_usd`
  - `price_input_per_mtok`
  - `price_output_per_mtok` (blank when unavailable)

### JSON
- Shape:
  - `metadata`: `timestamp`, `characters`, `words`, `lines`, `bytes`, `last_updated`
  - `rows`: array of visible rows with:
    - `provider`, `model`, `exactness`, `tokens`
    - `input_cost_usd`, `output_cost_usd`, `total_cost_usd`
    - `price_input_per_mtok`, `price_output_per_mtok`
