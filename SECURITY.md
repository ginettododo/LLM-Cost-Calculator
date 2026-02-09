# Security & Privacy

## Scope
This project is a static frontend application. It has no backend runtime and no server-side data storage.

## Data Handling
- All text processing (normalization, counters, token estimation/exact counting, cost math) runs locally in the browser.
- Pricing data is bundled from `src/data/prices.json` at build time.
- The app does not send user text to external APIs.
- The app does not use analytics, tracking pixels, or telemetry services.

## Network Behavior
- Runtime app behavior: no outbound API calls for token counting or pricing.
- Build/CI behavior: GitHub Actions may fetch dependencies and run repository scripts; scheduled pricing workflow updates repository data only.

## Secrets
- No application secrets are required for runtime.
- The pricing updater workflow only uses the default `GITHUB_TOKEN` provided by GitHub Actions.

## Reporting
If you find a security issue, open a private report with repository maintainers before public disclosure.
