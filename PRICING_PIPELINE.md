# Pricing Pipeline (Static-Friendly)

This repo uses a conservative, free pricing maintenance pipeline that keeps runtime fully static.

## Principles
- Runtime stays static-only: no backend, no serverless, no paid API usage.
- Pricing data source of truth is `src/data/prices.json`.
- GitHub Actions is used for scheduled validation/canonicalization and optional auto-commit when the file changes.

## Local Scripts
- `npm run prices:update`
  - Reads `src/data/prices.json`
  - Validates shape and date fields
  - Canonicalizes ordering/formatting
  - Writes file only when canonical content differs
- `npm run prices:validate`
  - Strictly validates schema
  - Exits non-zero on any validation error

## Scheduled Workflow
Workflow: `.github/workflows/pricing-update.yml`

Triggers:
- Weekly schedule: Monday at 06:00 UTC
- Manual dispatch

Steps:
1. Checkout repository
2. Install dependencies (`npm install`)
3. Run `npm run prices:update`
4. Run `npm run prices:validate`
5. If `src/data/prices.json` changed, commit and push with `GITHUB_TOKEN`

## Failure Behavior
- Validation error: workflow fails loudly (non-zero exit).
- Invalid date fields: workflow fails loudly.
- No data changes: workflow exits successfully without commit.

## Manual Price Edits
When provider prices change, maintainers should update `src/data/prices.json` manually from official provider pages, then run:

```bash
npm run prices:update
npm run prices:validate
npm run test
npm run build
```

Commit the updated JSON and changelog notes in the same PR.
