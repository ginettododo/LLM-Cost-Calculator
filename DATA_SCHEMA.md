# DATA_SCHEMA — prices.json

## Overview
`prices.json` is a versioned local data file bundled with the static site. It contains pricing data for LLM models across providers. The app reads this file at runtime to populate the pricing table and “Last updated” date.

## JSON schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LLM Pricing Data",
  "type": "object",
  "required": ["currency", "retrieved_at", "source_url", "models"],
  "properties": {
    "currency": {
      "type": "string",
      "enum": ["USD"]
    },
    "retrieved_at": {
      "type": "string",
      "description": "ISO 8601 date-time when pricing was retrieved",
      "format": "date-time"
    },
    "source_url": {
      "type": "string",
      "format": "uri"
    },
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
          "provider": {
            "type": "string"
          },
          "model": {
            "type": "string"
          },
          "model_id": {
            "type": "string",
            "description": "Stable identifier like provider:model"
          },
          "release_date": {
            "type": "string",
            "description": "Optional ISO 8601 date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
          },
          "modality": {
            "type": "string",
            "enum": ["text", "audio", "realtime", "multimodal"]
          },
          "input_per_mtok": {
            "type": "number",
            "minimum": 0
          },
          "output_per_mtok": {
            "type": "number",
            "minimum": 0
          },
          "cached_input_per_mtok": {
            "type": "number",
            "minimum": 0
          },
          "currency": {
            "type": "string",
            "enum": ["USD"]
          },
          "source_url": {
            "type": "string",
            "format": "uri"
          },
          "retrieved_at": {
            "type": "string",
            "format": "date-time"
          },
          "pricing_confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "pricing_tier": {
            "type": "string"
          },
          "is_tiered": {
            "type": "boolean"
          },
          "tokenization": {
            "type": "string",
            "enum": ["exact", "estimated"]
          },
          "notes": {
            "type": "string"
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

## Example
```json
{
  "currency": "USD",
  "retrieved_at": "2026-02-09T00:00:00Z",
  "source_url": "https://openai.com/pricing",
  "models": [
    {
      "provider": "OpenAI",
      "model": "gpt-4o",
      "model_id": "openai:gpt-4o",
      "release_date": "2024-05-13",
      "modality": "text",
      "input_per_mtok": 5.0,
      "output_per_mtok": 15.0,
      "currency": "USD",
      "source_url": "https://openai.com/pricing",
      "retrieved_at": "2026-02-09T00:00:00Z",
      "pricing_confidence": "high",
      "tokenization": "exact"
    },
    {
      "provider": "Anthropic",
      "model": "claude-3.5-sonnet",
      "model_id": "anthropic:claude-3.5-sonnet",
      "release_date": "2024-06-20",
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
