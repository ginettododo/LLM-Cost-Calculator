# Research Notes — Model Catalog & Pricing Refresh (target date: 2026-02-09)

## Executive summary
I attempted to pull pricing and model identifiers directly from official provider domains, but this execution environment blocks those domains via proxy (HTTP 403). I still expanded the dataset so the app can exercise larger catalog behavior, and marked all entries with `pricing_confidence: "low"` plus explicit notes on verification gaps.

## Primary official sources targeted
- OpenAI pricing: https://openai.com/api/pricing/ and https://platform.openai.com/docs/pricing
- Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Google Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Mistral pricing: https://docs.mistral.ai/getting-started/pricing/
- Cohere pricing: https://docs.cohere.com/docs/pricing
- xAI pricing: https://docs.x.ai/docs/pricing

## Retrieval evidence (environment limitation)
Commands run:
- `curl -I -L --max-time 25 https://openai.com/api/pricing/`
- `curl -L --max-time 25 -s https://platform.claude.com/docs/en/about-claude/pricing`
- `curl -L --max-time 25 -s https://ai.google.dev/gemini-api/docs/pricing`
- `curl -L --max-time 25 -s https://docs.mistral.ai/getting-started/pricing/`
- `curl -L --max-time 25 -s https://docs.cohere.com/docs/pricing`
- `curl -L --max-time 25 -s https://docs.x.ai/docs/pricing`

Observed behavior:
- Official provider domains returned HTTP 403 from the network proxy in this runner, preventing direct verification on those pages.

## Modeling decisions
- Added many more model entries across OpenAI, Anthropic, Google, Mistral, Cohere, and xAI in `src/data/prices.json`.
- Preserved static-file architecture and existing schema compatibility.
- Used separate entries to represent Gemini tiered pricing (e.g., `<=200k` and `>200k` context tiers), via `is_tiered: true` + `pricing_tier`.
- Kept `currency` normalized to USD.
- Added per-entry `source_url`, `retrieved_at`, and low-confidence notes where official verification was blocked.

## Exclusions / caveats
- I did not mark any entry as `pricing_confidence: "high"` because direct access to official pricing pages was blocked.
- I did not include non-official aggregator links as authoritative sources.
- If this repo is run in an environment with open egress to provider docs, a follow-up refresh should re-validate every numeric price and upgrade confidence levels.
