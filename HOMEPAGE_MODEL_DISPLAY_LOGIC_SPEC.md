# Homepage Model Display Logic Specification

## 1) Homepage Logic Architecture

### 1.1 Objective
Design a deterministic, curated homepage model display that prioritizes recency and model quality while preserving provider fairness and discoverability.

### 1.2 Page Composition
The homepage model display is divided into two primary sections:

1. **Featured Models (Top 8)**
   - Curated cross-provider list.
   - Focuses on latest flagship-line models from OpenAI, Google, and Anthropic.
   - Maximum 8 models.
2. **Other Models**
   - Full remaining eligible inventory.
   - Grouped by provider.
   - Collapsible provider sections.
   - Sorted newest to oldest inside each provider.

### 1.3 Processing Pipeline (High-Level)
1. **Ingest** model catalog records from canonical registry.
2. **Eligibility gate** excludes deprecated models (`status == deprecated`).
3. **Normalize** fields required for ranking/filtering (tier, release date, provider class, price snapshot).
4. **Build Featured candidate pool** from major providers (OpenAI, Google, Anthropic) with fairness and cap constraints.
5. **Rank Featured candidates** with deterministic sort rules.
6. **Publish Featured list** (max 8).
7. **Build Other Models list** from remaining eligible models not shown in Featured.
8. **Apply UI-state transforms** (view mode, search, provider/model filters, pinned models, compare selections).

### 1.4 Featured Section Constraints
- Include only non-deprecated models.
- Include latest flagship-line models from OpenAI, Google, Anthropic.
- Limit over-concentration: if >3 newly released candidates from same provider in the candidate window, include at most 3 from that provider.
- Guarantee representation: include at least 1 model from each major provider when eligible inventory exists.
- Total card count capped at 8.
- Each card must render:
  - Provider logo badge.
  - Pricing snapshot (input/output token pricing or equivalent summary).
  - Dynamic “NEW” badge for releases within last 90 days.

### 1.5 Other Models Section Constraints
- Dataset = all eligible models not already present in Featured.
- Group by provider.
- Provider groups collapsed by default on compact screens, expanded on desktop default (configurable).
- Per-provider ordering: newest release date first.
- Supports same dynamic NEW indicator.

---

## 2) Model Ranking Algorithm Logic

### 2.1 Inputs
For each model:
- `provider`
- `model_name`
- `status`
- `release_date`
- `tier` (flagship / fast / mini)
- `pricing_snapshot`
- `is_major_provider` (OpenAI | Google | Anthropic)

### 2.2 Eligibility
A model is ranking-eligible if:
- `status != deprecated`
- `release_date` is parseable (fallback rules if missing; see data dependencies)
- `tier` maps to supported hierarchy (fallback to `mini` if unknown, with observability warning)

### 2.3 Tier Priority Weights
Define deterministic tier score:
- `flagship = 3`
- `fast = 2`
- `mini = 1`

### 2.4 Featured Candidate Strategy
1. Start with major-provider models only.
2. Restrict to “latest flagship-line models” interpreted as tiers in `{flagship, fast, mini}` tied to each provider’s current generation line (from registry metadata flag such as `is_current_generation = true`).
3. Enforce per-provider freshness cap:
   - In the “new models window” (e.g., last 180 days), take at most 3 models per provider into final Featured selection flow.
4. Ensure at least one eligible model from each major provider is reserved before filling remaining slots.

### 2.5 Sorting Rules (Featured)
Primary-to-secondary ordering:
1. `release_date` descending (newest first)
2. `tier_score` descending (`flagship > fast > mini`)
3. `provider_priority` stable fallback for deterministic ordering (`OpenAI`, `Google`, `Anthropic` or configurable)
4. `model_name` ascending as final tie-break

### 2.6 Selection Procedure (Featured Max 8)
1. Build reserved set: top-ranked eligible model per major provider.
2. Build fill set: remaining eligible candidates after reserved picks.
3. Apply sort rules to fill set.
4. Add fill set entries until total count is 8.
5. If total eligible < 8, show available count without placeholders.

### 2.7 NEW Badge Logic
- Compute `days_since_release = today_utc - release_date_utc`.
- `is_new = days_since_release <= 90`.
- Badge label: `NEW`.
- Badge is computed server-side or shared selector logic to avoid timezone inconsistencies.

---

## 3) Filtering Logic Pseudocode

```text
INPUTS:
  allModels
  now
  uiState = {
    selectedProviders[]
    searchQuery
    viewMode            // compact | detailed
    pinnedModelIds[]
    compareModelIds[]
  }

CONSTANTS:
  MAJOR_PROVIDERS = ["OpenAI", "Google", "Anthropic"]
  FEATURED_MAX = 8
  PER_PROVIDER_NEW_CAP = 3
  NEW_DAYS = 90

FUNCTION buildHomepageModelState(allModels, now, uiState):
  eligible = filter(allModels, m => m.status != "deprecated")

  normalized = map(eligible, m => ({
    ...m,
    tierScore: mapTier(m.tier),
    isMajor: MAJOR_PROVIDERS contains m.provider,
    isNew: daysBetween(now, m.releaseDate) <= NEW_DAYS
  }))

  majorPool = filter(normalized, m => m.isMajor && m.isCurrentGeneration == true)

  # fairness cap in recent window
  recentWindowPool = enforceRecentPerProviderCap(
    majorPool,
    maxPerProvider = PER_PROVIDER_NEW_CAP,
    windowDays = 180
  )

  reserved = []
  FOR provider in MAJOR_PROVIDERS:
    candidates = sortFeatured(filter(recentWindowPool, m => m.provider == provider))
    IF candidates not empty:
      reserved.push(candidates[0])

  fillPool = recentWindowPool excluding reserved
  fillPool = sortFeatured(fillPool)

  featured = reserved + take(fillPool, FEATURED_MAX - len(reserved))
  featured = sortFeatured(featured)    # final display ordering

  featuredIds = set(featured.modelId)
  otherModelsRaw = filter(normalized, m => m.modelId not in featuredIds)

  # search + provider filter applies to visible lists (without breaking featured curation intent)
  visibleFeatured = applyUiFilters(featured, uiState)
  visibleOther = applyUiFilters(otherModelsRaw, uiState)

  # pinning: pinned models bubble to top within their current section
  visibleFeatured = reorderPinnedFirst(visibleFeatured, uiState.pinnedModelIds)
  visibleOther = reorderPinnedFirst(visibleOther, uiState.pinnedModelIds)

  # group other models by provider, newest first
  otherByProvider = groupBy(visibleOther, m => m.provider)
  FOR each providerGroup in otherByProvider:
    providerGroup.models = sortBy(providerGroup.models, [releaseDate DESC, tierScore DESC, modelName ASC])

  compareState = {
    selected: uiState.compareModelIds,
    enabled: len(uiState.compareModelIds) >= 2
  }

  RETURN {
    featured: take(visibleFeatured, FEATURED_MAX),
    otherByProvider,
    compareState,
    viewMode: uiState.viewMode
  }

FUNCTION sortFeatured(models):
  RETURN sortBy(models, [releaseDate DESC, tierScore DESC, providerPriority ASC, modelName ASC])
```

---

## 4) UI Behavior Specification

### 4.1 Featured Models UI
- Display up to 8 cards in a prioritized grid.
- Card anatomy:
  - Provider logo badge (top-left).
  - Model name + tier tag.
  - Pricing snapshot (input/output or blended reference).
  - Release date.
  - Conditional `NEW` badge if <=90 days.
  - Pin toggle.
  - Compare checkbox/select control.
- Empty state: if no eligible featured models, show informative placeholder with suggestion to clear filters.

### 4.2 Other Models UI
- Render provider accordion groups.
- Group header includes:
  - Provider name + logo.
  - Model count.
  - Expand/collapse chevron.
- Within group:
  - Cards/rows sorted newest to oldest.
  - Supports compact/detailed mode rendering.
  - Pin and compare controls remain consistent with Featured interaction model.

### 4.3 Compact vs Detailed Toggle
- **Compact mode**:
  - Dense row format.
  - Minimal metadata (model name, provider, tier, price summary, NEW badge).
  - Optimized for scanning large lists.
- **Detailed mode**:
  - Full card format.
  - Includes release date, richer pricing breakdown, context tags.

### 4.4 Search + Provider/Model Filtering
- Single search bar supports:
  - Free text matching on model name.
  - Provider keyword matching.
  - Optional token parsing (`provider:openai`, `tier:flagship`) for advanced filter UX.
- Filter behavior:
  - Case-insensitive.
  - Debounced (e.g., 150–250ms).
  - Applies consistently to both sections while preserving Featured ranking logic for items still visible.

### 4.5 Pin to Top Behavior
- User can pin any model.
- Pin state persisted per user/session (depending on auth state).
- Pinned models float to top of their current section while maintaining pinned-item internal sort order by recency/tier.
- Pinned state survives view mode switches and filter changes when item remains in result set.

### 4.6 Compare (Multi-Select) Behavior
- Compare control enabled on each model row/card.
- Sticky compare bar appears when >=2 models selected.
- Compare CTA disabled for <2 selections.
- Compare selection persists during filtering; hidden selected models remain counted and surfaced in compare tray.
- Optional guardrail: selection cap (e.g., max 4) for readable comparison layouts.

### 4.7 Responsive & Accessibility Notes
- Mobile:
  - Featured becomes horizontal scroll cards or 2-column compact grid.
  - Other Models groups default collapsed.
- Keyboard accessibility:
  - Pin/compare controls reachable and labeled.
  - Accordion states announced via ARIA.
- Badge semantics:
  - `NEW` exposed to assistive tech as “Released in last 90 days”.

---

## 5) Data Dependency Requirements

### 5.1 Required Model Fields
Minimum schema needed for logic:
- `model_id` (stable unique key)
- `provider` (normalized enum/string)
- `model_name`
- `status` (must include `deprecated` state)
- `tier` (`flagship | fast | mini`)
- `release_date` (ISO-8601 UTC recommended)
- `pricing_snapshot`:
  - `input_price_per_1m_tokens`
  - `output_price_per_1m_tokens`
  - optional cached display string
- `is_current_generation` (boolean for “latest flagship line” curation)

### 5.2 Derived/Computed Fields
- `tier_score` (from tier mapping)
- `is_new` (release <= 90 days)
- `provider_priority` (for deterministic tie-breaks)
- `days_since_release`

### 5.3 Data Quality & Validation Rules
- Reject or quarantine records missing `model_id`, `provider`, or `status`.
- If `release_date` missing/invalid:
  - Exclude from Featured.
  - Allow in Other Models with fallback order at bottom and telemetry event.
- If `tier` unknown:
  - Map to lowest priority (`mini`) and emit validation warning.
- Pricing snapshot freshness SLA should be explicit (e.g., update daily).

### 5.4 Operational Dependencies
- Central model registry/API must expose non-deprecated status reliably.
- Provider logo asset mapping must be maintained per provider key.
- Time source should be consistent (UTC) across backend/frontend to prevent NEW badge drift.
- Telemetry events required for:
  - Pin actions
  - Compare selections
  - Filter usage
  - Section expansion/collapse

### 5.5 Configuration Hooks
System should support non-code config for:
- Major provider list.
- Featured max count.
- NEW badge window (default 90 days).
- Per-provider recent-model cap (default 3).
- Provider display priority fallback.
