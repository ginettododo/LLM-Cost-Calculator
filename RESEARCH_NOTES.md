# Research Notes — Pricing Updates (9 Feb 2026)

## Summary
This update attempted to refresh pricing and model catalogs using official sources. Network access in the environment blocked all direct access to the required provider domains (HTTP 403 from the proxy), so pricing and model identifiers could not be re-verified. The data file was updated structurally to support the requested fields, and entries were annotated with low confidence to reflect the verification gap.

## Official sources targeted
- OpenAI pricing: https://openai.com/api/pricing/ (also https://openai.com/pricing and https://platform.openai.com/docs/pricing)
- Anthropic pricing: https://www.anthropic.com/pricing and https://platform.claude.com/docs/en/about-claude/pricing
- Google Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Mistral pricing (planned, not accessed): https://mistral.ai/pricing/
- Cohere pricing (planned, not accessed): https://cohere.com/pricing
- xAI pricing (planned, not accessed): https://x.ai/pricing

## Access issues encountered
- Direct requests to the official OpenAI, Anthropic, and Gemini pricing pages returned HTTP 403 (proxy denial), preventing access to the primary sources in this environment.
- The browser automation tool also received HTTP 403 for OpenAI pricing, confirming the block.

## Modeling decisions
- Added `model_id`, `modality`, `pricing_confidence`, `pricing_tier`, `is_tiered`, `tokenization`, and `notes` fields to support tiered pricing and tokenization filters once verified data can be ingested.
- `pricing_confidence` is set to `"low"` with notes indicating the verification gap due to blocked access.
- The "Last updated" banner now uses the latest `retrieved_at` timestamp across the dataset.

## Excluded entries and rationale
- OpenAI, Anthropic, and Gemini model expansions were not added because official pricing sources were inaccessible in this environment.
- Mistral, Cohere, and xAI were not added for the same reason (official pricing could not be reached for verification).
