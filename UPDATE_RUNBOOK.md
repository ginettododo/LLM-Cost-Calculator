# Update Runbook

This runbook covers local updates, debugging failures, and manual overrides for `prices.json`.

## Local Update (Developer Machine)

1. **Install dependencies** (if scripts exist):
   - `npm install`
2. **Run fetch + normalize**:
   - `node scripts/fetch-pricing.mjs`
3. **Validate output**:
   - `node scripts/validate-prices.mjs`
4. **Update changelog**:
   - `node scripts/update-changelog.mjs`
5. **Review `prices.json`** and commit.

> If scripts do not exist yet, implement them according to `PRICING_PIPELINE.md` before running locally.

## Debugging Failures

Common failure modes and what to check:

- **Parsing error**
  - Check raw HTML/JSON artifacts.
  - Confirm the selector/regex is still valid.
  - Verify the expected currency and units.

- **Validation error**
  - Compare output to `PRICES_JSON_SPEC.md`.
  - Ensure all models have `input_per_1m` and `output_per_1m` numeric values.

- **No changes**
  - If pricing is unchanged, no commit is expected.

## Manual Override Workflow (GitHub Actions)

Create a separate workflow, for example:

- `.github/workflows/manual-prices-override.yml`
- Trigger: `workflow_dispatch` with inputs:
  - `prices_json` (string, JSON payload)
  - or `upload` (file upload) for `prices.json`

**Behavior**:

1. Validate the provided JSON against the schema.
2. Update `prices.json` and `CHANGELOG.md`.
3. Commit with message: `chore(pricing): manual override`.

## Manual Override (Local)

1. Edit `prices.json` manually.
2. Validate using `node scripts/validate-prices.mjs`.
3. Update `CHANGELOG.md` with `- pricing updated on YYYY-MM-DD`.
4. Commit changes.

## Rollback Strategy

- Revert the commit that updated `prices.json`.
- Re-run the workflow once the parser is fixed.

## Freshness in the App

- The UI should read `last_updated` from `prices.json` and display it as “Last updated: YYYY-MM-DD”.
- If desired, add a badge or tooltip to indicate `pricing_confidence` per provider.
