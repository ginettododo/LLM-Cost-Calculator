# Pricing Sources

This document lists the official sources used to derive token pricing data for the static `prices.json` file. The pipeline must prefer machine-readable endpoints (JSON, CSV, HTML tables with stable structure). If a page is heuristic-only, mark `pricing_confidence` accordingly and fail the workflow on parsing errors.

## Sources

| provider | source_url | update_frequency_suggestion | notes / caveats |
| --- | --- | --- | --- |
| OpenAI | https://openai.com/pricing | Weekly | Prefer any embedded JSON (e.g., `application/ld+json` or data tables) before HTML scraping. Prices are listed as input/output per 1M tokens and may vary by model family. |
| Anthropic | https://www.anthropic.com/pricing | Weekly | Prefer machine-readable tables if present. Ensure model names match official naming conventions (e.g., Claude 3 family). |
| Google Gemini API | https://ai.google.dev/pricing | Weekly | Prefer published pricing tables and any JSON embedded in the docs. Verify whether prices differ by region or currency; default to USD. |

## General Guidelines

- **Only official sources**: Do not use third-party aggregators.
- **Resilience**: If a source layout changes, parsing must fail loudly to avoid publishing incorrect prices.
- **Currency**: Normalize all prices to USD per 1M tokens.
- **Traceability**: Store `source_url` and `retrieved_at` per provider in `prices.json`.
- **Confidence**: Set `pricing_confidence` to `"official"` when a structured source is used, or `"heuristic"` when parsing relies on brittle HTML.
