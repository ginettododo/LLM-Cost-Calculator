# Pricing Pipeline (Static-Friendly)

This document defines a **free**, GitHub Actions–based pipeline that refreshes `prices.json` for the static web app. The pipeline is **read-only to external services** (HTTP GET) and writes only to the repo using the default `GITHUB_TOKEN`.

## Overview

- **Trigger**: Scheduled GitHub Actions workflow (e.g., daily/weekly) + manual dispatch.
- **Goal**: Fetch official pricing pages, extract input/output rates per 1M tokens, normalize to a shared schema, validate, and update `prices.json` + `CHANGELOG.md` snippet.
- **No backend**: Output is committed directly to the repository so the app remains fully static.

## Step-by-Step Workflow

1. **Fetch source pages (HTTP GET)**
   - Use `curl` (or `node`/`python` HTTP libraries) to download each provider’s official pricing page.
   - Persist raw HTML/JSON in a temporary build folder for debugging (`artifacts/` in CI).

2. **Extract pricing numbers**
   - For each provider, parse **input** and **output** price per 1M tokens.
   - Prefer structured data (JSON, table with stable selectors). If only unstructured HTML is available, implement strict parsing rules with explicit selectors and value checks.

3. **Normalize to a single schema**
   - Map provider-specific model names and prices into the `prices.json` schema (see `PRICES_JSON_SPEC.md`).
   - Ensure all prices are USD per 1M tokens.

4. **Validate with JSON Schema / Zod**
   - Validate `prices.json` against a schema file or embedded Zod schema.
   - If validation fails, the workflow **must exit non-zero**.

5. **Commit update to repo (recommended: commit to main)**
   - If `prices.json` has changed, commit with a message like: `chore(pricing): update prices.json`.
   - Use the default `GITHUB_TOKEN` (no extra secrets).
   - Alternative: open a PR instead of direct commit. If you prefer PRs, document and implement that path; otherwise default to direct commit for simplicity.

6. **Store retrieved_at timestamps**
   - Set a `retrieved_at` ISO timestamp per provider and a top-level `last_updated` for UI display.

7. **Maintain CHANGELOG snippet**
   - Append a line to `CHANGELOG.md`: `- pricing updated on YYYY-MM-DD`.
   - If `CHANGELOG.md` does not exist, create it during the update step.

## Failure Modes (Fail Loudly)

- **Parsing failure**: If a selector does not match or a value cannot be parsed, throw an error and stop.
- **Validation failure**: If JSON schema validation fails, stop and do not commit.
- **No changes**: If the resulting JSON is identical, exit gracefully without a commit.
- **Partial data**: If any provider is missing models or prices, stop and require manual intervention.

## Minimal Script Design (No Full Implementation)

- `scripts/fetch-pricing.mjs`
  - Fetch pages, parse pricing, produce normalized JSON.
- `scripts/validate-prices.mjs`
  - Validate with Zod or JSON Schema.
- `scripts/update-changelog.mjs`
  - Update the changelog snippet.
- A single wrapper script can orchestrate the steps and write `prices.json`.

## Suggested GitHub Actions Flow (Pseudo)

- `on: schedule` (weekly) and `workflow_dispatch`
- Steps:
  1. Checkout
  2. Setup Node
  3. Install deps
  4. Run `node scripts/fetch-pricing.mjs`
  5. Run `node scripts/validate-prices.mjs`
  6. Run `node scripts/update-changelog.mjs`
  7. Commit and push if changes

## Manual Override Path

A separate `workflow_dispatch` workflow should allow maintainers to upload or edit `prices.json` manually. See `UPDATE_RUNBOOK.md` for details.
