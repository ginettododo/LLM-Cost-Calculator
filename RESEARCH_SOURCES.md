# Research Sources (Pricing Refresh — 2026-02-09)

## Official pricing sources used

1. OpenAI API Pricing (official): https://openai.com/api/pricing/?utm_source=chatgpt.com
2. Google Gemini API Pricing (official): https://ai.google.dev/gemini-api/docs/pricing
3. Anthropic Claude Pricing (official): https://docs.anthropic.com/en/docs/about-claude/pricing
4. Cohere Pricing (official, optional provider): https://docs.cohere.com/docs/pricing

## Notes on retrieval and confidence

This runtime cannot fetch the above domains directly (proxy returns `403 CONNECT tunnel failed`).

Commands executed:

- `curl -L --max-time 25 -A 'Mozilla/5.0' 'https://openai.com/api/pricing/?utm_source=chatgpt.com'`
- `curl -L --max-time 25 -A 'Mozilla/5.0' 'https://ai.google.dev/gemini-api/docs/pricing'`
- `curl -L --max-time 25 -A 'Mozilla/5.0' 'https://docs.anthropic.com/en/docs/about-claude/pricing'`
- `curl -L --max-time 25 -A 'Mozilla/5.0' 'https://docs.cohere.com/docs/pricing'`

Because of this environment limitation:

- `pricing_confidence: "high"` is used only where pricing was directly supplied in the task prompt (GPT-5.2) or from previously validated first-party values already maintained in this repository.
- `pricing_confidence: "medium"` is used where model family values are aligned to official provider pricing pages but could not be re-fetched from this runtime on this run.
- `pricing_confidence: "low"` is used for optional provider entries that should be re-verified before production use.

## Key figures captured

- OpenAI GPT-5.2: Input $1.750 / 1M, Output $14.000 / 1M (from user-supplied official OpenAI citation in the task prompt).
- OpenAI GPT-4.1 family and other OpenAI entries retained from official OpenAI pricing references.
- Google Gemini 3 Pro / Flash / Flash-Lite included with notes about tier conditions.
- Anthropic Claude Opus 4 / Sonnet 4.5 / Haiku 4.5 included from official Anthropic pricing references with confidence annotations.
