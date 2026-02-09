# prices.json Schema Specification

This document defines the **exact schema** for `prices.json` and an example object. All prices are normalized to **USD per 1M tokens**.

## Schema (JSON Schema–style)

```json
{
  "type": "object",
  "required": ["version", "last_updated", "providers"],
  "properties": {
    "version": { "type": "string", "description": "Schema version" },
    "last_updated": { "type": "string", "format": "date-time" },
    "providers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "provider",
          "source_url",
          "retrieved_at",
          "pricing_confidence",
          "models"
        ],
        "properties": {
          "provider": { "type": "string" },
          "source_url": { "type": "string", "format": "uri" },
          "retrieved_at": { "type": "string", "format": "date-time" },
          "pricing_confidence": {
            "type": "string",
            "enum": ["official", "heuristic"]
          },
          "models": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["model", "input_per_1m", "output_per_1m"],
              "properties": {
                "model": { "type": "string" },
                "input_per_1m": { "type": "number" },
                "output_per_1m": { "type": "number" },
                "notes": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

## Example Object

```json
{
  "version": "1.0",
  "last_updated": "2025-01-15T12:00:00Z",
  "providers": [
    {
      "provider": "OpenAI",
      "source_url": "https://openai.com/pricing",
      "retrieved_at": "2025-01-15T11:59:00Z",
      "pricing_confidence": "official",
      "models": [
        {
          "model": "gpt-4o-mini",
          "input_per_1m": 0.15,
          "output_per_1m": 0.60,
          "notes": "Example values"
        }
      ]
    },
    {
      "provider": "Anthropic",
      "source_url": "https://www.anthropic.com/pricing",
      "retrieved_at": "2025-01-15T11:58:00Z",
      "pricing_confidence": "heuristic",
      "models": [
        {
          "model": "claude-3-5-sonnet",
          "input_per_1m": 3.00,
          "output_per_1m": 15.00
        }
      ]
    }
  ]
}
```

## Notes

- `last_updated` should be the **most recent** `retrieved_at` across providers.
- `pricing_confidence` indicates whether parsing used structured data (`official`) or heuristics (`heuristic`).
- Additional fields should not be added without bumping `version`.
