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
      "description": "ISO 8601 date when pricing was retrieved",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "source_url": {
      "type": "string",
      "format": "uri"
    },
    "models": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["provider", "model", "input_per_mtok", "currency", "source_url", "retrieved_at"],
        "properties": {
          "provider": {
            "type": "string"
          },
          "model": {
            "type": "string"
          },
          "release_date": {
            "type": "string",
            "description": "Optional ISO 8601 date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
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
  "retrieved_at": "2024-11-01",
  "source_url": "https://example.com/llm-pricing",
  "models": [
    {
      "provider": "OpenAI",
      "model": "gpt-4o",
      "release_date": "2024-05-13",
      "input_per_mtok": 5.0,
      "output_per_mtok": 15.0,
      "currency": "USD",
      "source_url": "https://openai.com/pricing",
      "retrieved_at": "2024-11-01"
    },
    {
      "provider": "Anthropic",
      "model": "claude-3.5-sonnet",
      "release_date": "2024-06-20",
      "input_per_mtok": 3.0,
      "output_per_mtok": 15.0,
      "currency": "USD",
      "source_url": "https://www.anthropic.com/pricing",
      "retrieved_at": "2024-11-01"
    }
  ]
}
```

