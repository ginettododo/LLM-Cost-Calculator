# DATA_SCHEMA — `src/data/prices.json`

## Top-level shape

```json
{
  "currency": "USD",
  "retrieved_at": "2026-02-09T23:59:00Z",
  "source_url": "https://openai.com/api/pricing/?utm_source=chatgpt.com",
  "featuredModels": ["openai:gpt-5.2"],
  "models": [
    {
      "provider": "OpenAI",
      "model_id": "openai:gpt-5.2",
      "display_name": "GPT-5.2",
      "category": "flagship",
      "pricing": [
        { "kind": "input", "price_per_million": 1.75, "currency": "USD" },
        { "kind": "output", "price_per_million": 14, "currency": "USD" }
      ],
      "release_date": "2026-02-01",
      "pricing_confidence": "high",
      "source_url": "https://openai.com/api/pricing/?utm_source=chatgpt.com",
      "notes": "From OpenAI API pricing page."
    }
  ]
}
```

## Model fields

- `provider`: provider display group (OpenAI, Google, Anthropic, etc).
- `model_id`: unique stable ID (`provider:model-name`).
- `display_name`: UI label.
- `category`: one of `flagship | mainstream | budget | legacy`.
- `pricing`: pricing entries; must include an `input` entry and may include `output`.
- `release_date`: optional ISO date (`YYYY-MM-DD`) when documented.
- `pricing_confidence`: `high | medium | low`.
- `source_url`: official source URL.
- `notes`: optional caveats (tiering/context-window conditions).

## Featured models

`featuredModels` is an ordered array of `model_id` values used by the UI featured strip.
