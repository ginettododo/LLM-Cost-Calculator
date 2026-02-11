# LLM Registry Architecture Plan (No-Implementation)

## Scope
This document proposes a **modern, scalable, update-friendly LLM registry architecture** for replacing the current static model list. It intentionally focuses on design and operating model only (no code implementation).

---

## 1) Proposed JSON Schema Structure

### 1.1 Design Principles
- Keep model identity and capabilities in a metadata registry (`models.json`).
- Keep commercial/pricing data in separate pricing revision files.
- Allow deterministic filtering and sorting in API/UI layers.
- Preserve historical pricing and support effective date ranges.

### 1.2 `models.json` (metadata + capability registry)
```json
{
  "schema_version": "1.0.0",
  "generated_at": "2026-02-11",
  "providers": {
    "openai": {
      "display_name": "OpenAI",
      "website": "https://openai.com",
      "models": [
        {
          "id": "openai:gpt-4.1",
          "provider": "openai",
          "model_name": "gpt-4.1",
          "context_window": 128000,
          "supports_vision": true,
          "supports_audio": false,
          "supports_reasoning": true,
          "release_date": "2025-01-15",
          "status": "stable",
          "tier": "flagship",
          "last_verified_date": "2026-02-01",
          "pricing_ref": "openai/gpt-4.1",
          "tags": ["chat", "tool-use"]
        }
      ]
    },
    "google": {
      "display_name": "Google",
      "website": "https://ai.google.dev",
      "models": []
    },
    "anthropic": {
      "display_name": "Anthropic",
      "website": "https://www.anthropic.com",
      "models": []
    },
    "cohere": {
      "display_name": "Cohere",
      "website": "https://cohere.com",
      "models": []
    }
  }
}
```

### 1.3 Pricing schema (separate from metadata)
```json
{
  "schema_version": "1.0.0",
  "provider": "openai",
  "model_key": "openai/gpt-4.1",
  "revisions": [
    {
      "revision_id": "2026-01-01",
      "effective_start": "2026-01-01",
      "effective_end": null,
      "currency": "USD",
      "unit": "per_1k_tokens",
      "input_cost_per_1k": 0.005,
      "output_cost_per_1k": 0.015,
      "source": {
        "type": "official_pricing_page",
        "url": "https://platform.openai.com/pricing",
        "fetched_at": "2026-01-01T08:00:00Z"
      }
    }
  ]
}
```

### 1.4 Required fields mapping (from requirements)
Each model entry in `models.json` contains:
- `id`
- `provider`
- `model_name`
- `context_window`
- `supports_vision`
- `supports_audio`
- `supports_reasoning`
- `release_date`
- `status` (`stable`, `preview`, `deprecated`)
- `tier` (`flagship`, `fast`, `mini`, `legacy`)
- `last_verified_date`

Pricing fields are stored in pricing revisions:
- `input_cost_per_1k`
- `output_cost_per_1k`

### 1.5 Status semantics
- `stable`: production-ready and generally available.
- `preview`: pre-GA or beta; pricing/behavior can shift.
- `deprecated`: active sunset path.
- `new`: represented as a computed flag (not a base status), where `release_date` is inside configurable freshness window (e.g., 90 days).

### 1.6 Filtering and sorting contract
- **Provider grouping:** data grouped under `providers.<provider>.models`.
- **Sort by release date:** descending default (`newest first`).
- **Filters:**
  - by `provider`
  - by `tier`
  - by `status`
- **Derived badge:** `is_new = (today - release_date) <= NEW_MODEL_WINDOW_DAYS`.

---

## 2) Folder Structure Proposal

```text
/registry
  /schemas
    model.schema.json
    pricing-revision.schema.json
    provider.schema.json

  /data
    models.json

    /pricing
      /openai
        gpt-4.1.json
        gpt-4o-mini.json
      /google
        gemini-1.5-pro.json
      /anthropic
        claude-3.5-sonnet.json
      /cohere
        command-r-plus.json

  /sources
    providers.yaml
    source-mapping.yaml

  /snapshots
    /2026-Q1
      models.snapshot.json
      pricing.snapshot.json

  /reports
    obsolete-models.json
    validation-report.json

/scripts
  update_registry.ts
  validate_registry.ts
  fetch_pricing.ts
  detect_obsolete.ts

/docs
  REGISTRY_OPERATIONS.md
  REGISTRY_SCHEMA_GUIDE.md
```

Rationale:
- `schemas/` enforces structure and validation.
- `data/models.json` is the canonical metadata registry.
- `data/pricing/*` keeps versioned per-model pricing revisions.
- `sources/` maps official URLs/APIs and provider aliases.
- `snapshots/` supports auditability and rollback.
- `reports/` captures update outcomes for governance.

---

## 3) Strategy to Maintain and Update Models Quarterly

### 3.1 Quarterly operating cadence (Q1/Q2/Q3/Q4)
1. **Discovery phase (week 1):** poll official provider endpoints/pages and release notes.
2. **Diff phase (week 1):** compare fresh source data vs. current registry.
3. **Review phase (week 2):** human sign-off for ambiguous changes (rename vs. replacement).
4. **Publish phase (week 2):** write new snapshot, update `last_verified_date`, release changelog.
5. **Post-publish monitoring (week 3+):** track failed lookups and stale entries.

### 3.2 Governance model
- **Owner:** AI Platform team.
- **Approvers:** Finance + Model Ops.
- **Change classes:**
  - `metadata-only`
  - `pricing-only`
  - `breaking` (id/provider/tier/status changes)

### 3.3 Validation gates before merge
- JSON schema validation (metadata + pricing).
- Referential integrity (`pricing_ref` resolves to pricing file).
- Allowed enum checks (`status`, `tier`, `provider`).
- Release date sanity check (`release_date <= last_verified_date`).
- Duplicate ID detection.

### 3.4 Release artifact
- Quarterly changelog with:
  - added models
  - deprecated models
  - status transitions
  - pricing revision updates

---

## 4) Strategy to Auto-Detect Obsolete Models

### 4.1 Signals
Use weighted, multi-signal detection:
- Missing from official catalog for N checks.
- Provider labels as deprecated/sunset.
- API probe indicates retired/not-found.
- No update in > X months and replaced by successor family.
- Internal usage drops near zero after replacement launch.

### 4.2 Obsolescence state machine
1. `stable|preview` → `candidate_deprecation` (internal report only)
2. `candidate_deprecation` → `deprecated` (after human approval)
3. `deprecated` → `retired_hidden` (optional hide from default UI after grace period)

### 4.3 Policy defaults
- Candidate threshold: missing for 2 consecutive runs.
- Deprecation grace: 90 days before UI hide.
- Never hard-delete immediately; maintain historical compatibility records.

### 4.4 Reporting
Generate `/registry/reports/obsolete-models.json` with:
- model id
- reason code(s)
- first detected date
- confidence score
- suggested action

---

## 5) Strategy to Fetch Official Pricing Updates

### 5.1 Source adapter pattern
Create one adapter per provider with a shared normalized interface:
- `fetchRaw()`
- `normalize()`
- `validate()`
- `emitPricingRevision()`

### 5.2 Preferred source priority
1. Official API endpoint (if available)
2. Official pricing JSON/structured feed
3. Official pricing webpage (parser fallback)
4. Manual override file (exception handling)

### 5.3 Normalization rules
- Convert all prices to `USD` and `per_1k_tokens` in stored revision.
- Record provenance (`source.url`, `fetched_at`, optional checksum).
- Preserve original units in optional `raw` section for audit.

### 5.4 Pricing revision lifecycle
- On detected change, close previous revision (`effective_end = change_date - 1 day`) and append a new revision.
- Do not mutate prior revision values retroactively.
- Keep immutable revision history for reproducibility.

### 5.5 Safety + quality controls
- Price anomaly detection (e.g., >50% unexpected delta requires manual review).
- Retry/backoff for provider outages.
- Signed snapshot and diff output for compliance.

---

## Recommended Rollout Phases (Non-Implementation Plan)

1. **Phase A (Design lock):** finalize schemas and enum policies.
2. **Phase B (Data migration):** convert static list into `models.json` + initial pricing revisions.
3. **Phase C (Pipeline):** automate fetch/validate/diff/report jobs.
4. **Phase D (UX integration):** wire sorting/filtering/status badges to registry data.
5. **Phase E (Operations):** enforce quarterly runbook and alerting.

This architecture fully replaces static hardcoded models, cleanly separates providers, supports status/tier filtering and release-date sorting, and enables long-term automated maintenance with auditable pricing version history.
