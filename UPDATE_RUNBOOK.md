# Pricing Update Runbook

This runbook covers manual updates to `src/data/prices.json` and CI verification.

## Manual Update Procedure
1. Edit `src/data/prices.json` with new values from official provider pricing pages.
2. Canonicalize and validate:
   ```bash
   npm run prices:update
   npm run prices:validate
   ```
3. Run quality gates:
   ```bash
   npm run test
   npm run build
   ```
4. Add a changelog note in `CHANGELOG.md`.
5. Commit and open a PR.

## Scheduled Automation
Workflow: `.github/workflows/pricing-update.yml`

Behavior:
- Runs weekly and on manual dispatch.
- Validates/canonicalizes `src/data/prices.json`.
- Commits only if canonicalization changes the file.

## Failure Recovery
- If validation fails:
  - Fix schema/date issues in `src/data/prices.json`.
  - Re-run `npm run prices:validate` locally.
- If a bad pricing update merged:
  - Revert the offending commit.
  - Re-apply corrected data with the standard procedure.

## UI Verification Checklist
After any pricing update:
- App loads with no console/runtime errors.
- Pricing table renders at least one provider/model row.
- Costs update after text input or paste.
- `Pricing data last updated` shows expected value from the JSON.
