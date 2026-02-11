# Token & Cost Estimator — UX/UI Redesign Blueprint

## 1) Structured Redesign Document

### Product direction
Reframe the application as a compact **decision cockpit** rather than a single-input calculator. The interface should help users answer three high-frequency questions quickly:
1. **How many tokens is this input?**
2. **What will this cost for my selected model?**
3. **Which model should I choose under my constraints?**

Design intent: dark-first, high information density, clear hierarchy, fintech-like precision, low ornamentation.

---

### Information architecture
Use a top-level tabbed IA to reduce clutter and keep each workflow focused:
- **Tab A: Cost Estimator** (default)
- **Tab B: Model Comparison**
- **Tab C: Usage Simulator**

Global controls (persistent across tabs):
- Model search + selector
- Pinned models quick strip
- Theme + token highlight toggle
- Last updated pricing timestamp

---

### Interaction model
- Real-time updates for all derived metrics using a **300ms debounce** from text input.
- Cost panel is sticky and always visible in desktop layouts.
- Fast switching model context without losing typed text.
- Inline prices and context window shown at selection time to reduce context switching.

---

### Visual hierarchy principles
1. **Primary focus:** input + immediate token/cost outcome.
2. **Secondary focus:** per-model pricing intelligence.
3. **Tertiary focus:** simulations, advanced settings, and long-tail controls.

Hierarchy mechanisms:
- Large numeric typography for totals.
- Monospaced metric values for audit-like readability.
- Low-contrast surfaces + high-contrast key figures.
- Strict spacing rhythm with shallow card depth (no heavy shadows).

---

### State handling and persistence
Persist in `localStorage`:
- Last selected model (auto-select on load).
- Token highlight toggle state.
- Pinned model IDs.
- Last active tab (optional but recommended).
- Input/output ratio slider value.

Default behaviors:
- Default comparison scope: **Top 8 Models**.
- If persisted model missing from latest pricing dataset, gracefully fall back to top-ranked model.

---

### Performance and usability guardrails
- Use memoized derived calculations and virtualized table rows for larger model sets.
- Debounce token counting at 300ms; avoid synchronous expensive work on every keystroke.
- Keep sticky panel repaint costs low (minimal animated transforms, no blur-heavy backgrounds).

---

### Accessibility and clarity
- Keyboard-first navigation across tabs, selector, table sorting, and copy buttons.
- Every metric tile includes label + value + accessible copy action.
- Color is supplemental; status meanings also encoded by icon/text.
- Ratio slider and advanced settings are fully keyboard operable and screen-reader labeled.

---

## 2) Component Tree Structure

```text
AppShell
├─ TopNav
│  ├─ ProductTitle
│  ├─ GlobalModelSearch
│  ├─ PinnedModelsStrip
│  ├─ TokenHighlightToggle (persistent)
│  └─ LastUpdatedBadge
├─ TabNavigation
│  ├─ CostEstimatorTab
│  ├─ ModelComparisonTab
│  └─ UsageSimulatorTab
└─ TabContent
   ├─ CostEstimatorView
   │  ├─ SplitLayout (65/35 desktop)
   │  │  ├─ LeftInputColumn
   │  │  │  ├─ InputHeader
   │  │  │  │  ├─ ActiveModelInlinePreview
   │  │  │  │  │  ├─ ContextWindowBadge
   │  │  │  │  │  ├─ InputCostBadge
   │  │  │  │  │  ├─ OutputCostBadge
   │  │  │  │  │  └─ ProviderBadge
   │  │  │  │  └─ UtilityActions (clear, paste preset)
   │  │  │  ├─ TokenizedTextarea
   │  │  │  ├─ LiveCountersRow
   │  │  │  ├─ InputOutputRatioSlider
   │  │  │  └─ AdvancedSettings (collapsible)
   │  │  └─ RightStickyColumn
   │  │     ├─ ModelSelectorCard
   │  │     │  ├─ ProviderFilter
   │  │     │  ├─ ModelDropdown
   │  │     │  ├─ PinModelAction
   │  │     │  └─ InlinePricingPreview
   │  │     ├─ CostSummaryCard
   │  │     │  ├─ InputTokensMetric (copy)
   │  │     │  ├─ OutputTokensMetric (copy)
   │  │     │  ├─ EstimatedCostMetric (copy)
   │  │     │  └─ AccuracyState
   │  │     └─ QuickActionsCard
   │  │        ├─ CopyAllMetrics
   │  │        └─ ExportActions
   ├─ ModelComparisonView
   │  ├─ HeaderControls
   │  │  ├─ SearchFilter
   │  │  ├─ Top8Toggle (default on)
   │  │  └─ ProviderFilter
   │  └─ SortableComparisonTable
   │     ├─ Columns: Provider, Model, Context, Input, Output, LatencyClass, Est.Cost
   │     └─ RowActions: Pin, SelectModel
   └─ UsageSimulatorView
      ├─ MonthlyUsageInputs
      │  ├─ RequestsPerDay
      │  ├─ AvgInputTokens
      │  ├─ AvgOutputTokens
      │  └─ ActiveDaysPerMonth
      ├─ ScenarioPresets
      └─ MonthlyCostProjectionPanel
```

---

## 3) Layout Wireframe Description (Responsive)

### Desktop (>= 1280px)
- Two-column shell under tabs.
- **Left column 65%**: text entry + immediate token controls.
- **Right column 35% (sticky)**: model selector and cost summary cards.
- Sticky offset starts below top nav for continuous visibility.
- Model selector appears above cost summary as requested.

### Laptop/Tablet (768px–1279px)
- Preserve two-column logic but relax to approx **60/40**.
- Sticky panel remains enabled where viewport height permits.
- Table in Model Comparison supports horizontal scroll with sticky header.

### Mobile (< 768px)
- Single-column stacked flow.
- Order: model selector → input → cost summary → advanced settings.
- Sticky behavior becomes sticky footer summary chip (total cost + tokens).
- Tabs remain top-level with compact segmented control style.

### Density and scroll strategy
- Use condensed card headers, compact metric rows, and collapsible advanced sections.
- Keep first meaningful screen containing all critical controls without full-page scroll on desktop.

---

## 4) UX Improvements List (Mapped to Requirements)

1. **Auto-select last used model** via localStorage key (e.g., `llmcalc.lastModelId`).
2. **Default to Top 8 Models** in Model Comparison tab with clear override toggle.
3. **Real-time token counting** using 300ms debounced input pipeline.
4. **Inline model pricing preview** in both selector and input header badges.
5. **Collapsible advanced settings** (persist open/closed optionally).
6. **Sticky right cost panel** in desktop/laptop layouts.
7. **Persistent token highlight toggle** in global controls.
8. **Replace quick comparison with sortable table** featuring multi-column sort/filter.
9. **Add model search filter** (name + provider fuzzy match).
10. **Pin model feature** for instant recall from global pinned strip.
11. **Input/output ratio slider** integrated into estimator calculations.
12. **Estimated monthly usage calculator** as dedicated Usage Simulator tab.
13. **Copy-to-clipboard actions on every metric** with toast feedback.

Additional recommended improvements:
14. Keyboard shortcut: `Ctrl/Cmd+K` focuses model search.
15. “Recently used models” group under dropdown.
16. Empty-state templates for common prompts (JSON, chat, docs).
17. Inline warning when context window threshold is near/exceeded.

---

## 5) Tailwind-Based Design System Suggestion

### Theme philosophy
- Dark-first neutral scale with one trust-building primary and one precision accent.
- Restrained saturation, high readability, clear semantic contrast.

### Token proposal

#### Colors
- **Primary (`brand`)**: `#3B82F6` (blue 500)
- **Accent (`accent`)**: `#14B8A6` (teal 500)
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Danger**: `#EF4444`

#### Background scale (dark)
- `bg-0`: `#0B1020` (app canvas)
- `bg-1`: `#121A2B` (primary panels)
- `bg-2`: `#1A2438` (elevated cards)
- `bg-3`: `#24324A` (hover/active surfaces)
- `border`: `#2C3B55`

#### Text scale/colors
- `text-primary`: `#E5E7EB`
- `text-secondary`: `#9CA3AF`
- `text-muted`: `#6B7280`
- `text-inverse`: `#0B1020`

#### Typography scale
- Display metric: `text-3xl` / `leading-tight` / `font-semibold`
- H1: `text-xl` / `font-semibold`
- H2/Card title: `text-sm` / `font-medium`
- Body: `text-sm`
- Caption/meta: `text-xs`
- Numeric metrics: `font-mono tabular-nums`

#### Radius scale
- `sm`: `rounded-md` (6px)
- `md`: `rounded-lg` (10px)
- `lg`: `rounded-xl` (14px)
- Pill badges: `rounded-full`

#### Spacing system (4px base)
- Micro: `1` (4px), `1.5` (6px), `2` (8px)
- Standard: `3` (12px), `4` (16px), `5` (20px)
- Section: `6` (24px), `8` (32px)

### Component variants

#### Button
- `primary`: brand background, high-contrast text
- `secondary`: bg-2 surface, subtle border
- `ghost`: transparent, hover bg-3
- `danger`: red tint for destructive actions
- Sizes: `sm`, `md`

#### Badge
- `neutral`: model/provider labels
- `brand`: selected/default emphasis
- `accent`: pricing highlights
- `warning`: near context limit

#### Card
- `default`: bg-1 + border
- `elevated`: bg-2 + stronger border contrast
- `metric`: compact padding, large numeric value, copy icon action

### Suggested Tailwind extension keys
- `theme.extend.colors` for brand/bg/text semantic palette
- `theme.extend.borderRadius` for `lg/xl`
- `theme.extend.boxShadow` minimal (`card`, `focus`)
- `theme.extend.fontFamily` for sans + mono metrics
- `theme.extend.spacing` for 18/22 if needed for compact density tuning

---

## Implementation sequencing (recommended)
1. IA + tab shell + sticky split layout.
2. Reworked model selection (search, pin, inline pricing).
3. Cost summary refactor + copy actions.
4. Sortable comparison table (Top 8 default).
5. Usage simulator and persistence polish.
6. Accessibility + keyboard/QA hardening.
