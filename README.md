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

## Tokenization Exactness
- **OpenAI models:** Exact token counts via a local, lazy-loaded tokenizer (tiktoken-compatible).
- **All other providers:** Estimated tokens using a char/4 heuristic until exact tokenizers are added.
- All tokenization runs offline in the browser; no API calls are made.
