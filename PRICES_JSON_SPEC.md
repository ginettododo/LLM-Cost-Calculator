# prices.json Schema Specification

This document defines the **exact schema** for `prices.json` and an example object. All prices are normalized to **USD per 1M tokens**.

## Schema (JSON Schema–style)

```json
{
  "type": "object",
  "required": ["currency", "retrieved_at", "source_url", "models"],
  "properties": {
    "currency": { "type": "string", "enum": ["USD"] },
    "retrieved_at": { "type": "string", "format": "date-time" },
    "source_url": { "type": "string", "format": "uri" },
    "models": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "provider",
          "model",
          "model_id",
          "modality",
          "input_per_mtok",
          "currency",
          "source_url",
          "retrieved_at",
          "pricing_confidence"
        ],
        "properties": {
          "provider": { "type": "string" },
          "model": { "type": "string" },
          "model_id": { "type": "string" },
          "release_date": { "type": "string", "format": "date" },
          "modality": {
            "type": "string",
            "enum": ["text", "audio", "realtime", "multimodal"]
          },
          "input_per_mtok": { "type": "number" },
          "output_per_mtok": { "type": "number" },
          "cached_input_per_mtok": { "type": "number" },
          "currency": { "type": "string", "enum": ["USD"] },
          "source_url": { "type": "string", "format": "uri" },
          "retrieved_at": { "type": "string", "format": "date-time" },
          "pricing_confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "pricing_tier": { "type": "string" },
          "is_tiered": { "type": "boolean" },
          "tokenization": { "type": "string", "enum": ["exact", "estimated"] },
          "notes": { "type": "string" }
        }
      }
    }
  }
}
```

## Example Object

```json
{
  "currency": "USD",
  "retrieved_at": "2026-02-09T00:00:00Z",
  "source_url": "https://openai.com/pricing",
  "models": [
    {
      "provider": "OpenAI",
      "model": "gpt-4o-mini",
      "model_id": "openai:gpt-4o-mini",
      "modality": "text",
      "input_per_mtok": 0.15,
      "output_per_mtok": 0.6,
      "currency": "USD",
      "source_url": "https://openai.com/pricing",
      "retrieved_at": "2026-02-09T00:00:00Z",
      "pricing_confidence": "high",
      "tokenization": "exact",
      "notes": "Example values"
    },
    {
      "provider": "Anthropic",
      "model": "claude-3.5-sonnet",
      "model_id": "anthropic:claude-3.5-sonnet",
      "modality": "text",
      "input_per_mtok": 3.0,
      "output_per_mtok": 15.0,
      "currency": "USD",
      "source_url": "https://www.anthropic.com/pricing",
      "retrieved_at": "2026-02-09T00:00:00Z",
      "pricing_confidence": "high",
      "tokenization": "estimated"
    }
  ]
}
```

## Notes

- `retrieved_at` should be the **most recent** model retrieval date across the file.
- `pricing_confidence` captures confidence in the pricing data for each model.
- If tiered pricing exists, either add separate entries per tier or set `is_tiered` + `pricing_tier`.
