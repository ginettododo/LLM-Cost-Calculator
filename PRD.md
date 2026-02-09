# PRD — Token & LLM Cost Calculator

## Problem statement
People evaluating or using LLMs often need to estimate token usage and cost quickly without sharing data with a third-party service. Existing tools either require API calls, lack transparent pricing data, or provide unclear token count accuracy. This app provides an offline, privacy-preserving, fully static way to count tokens and estimate costs with clear “Exact vs Estimated” labeling.

## Target user
- **Primary:** Product managers, engineers, researchers, and analysts comparing LLM costs or estimating prompt budgets.
- **Secondary:** Students and hobbyists exploring LLM pricing.

## Goals
1. Provide instant token counts and cost estimates for popular LLMs without any backend.
2. Offer transparent pricing data sourced and versioned locally in `prices.json`.
3. Clearly communicate accuracy: “Exact” vs “Estimated” token counting.
4. Enable quick comparison across providers and models with filtering, sorting, and search.

## Non-goals
1. No user accounts, authentication, or personalization beyond local UI state.
2. No API requests to LLM providers for pricing or tokenization.
3. No storage of user inputs on a server or database.
4. No model inference or chat capabilities.

## Functional requirements (numbered, testable)
1. **Text input:** Provide a large textarea for user input with a “Clear” action that empties the field.
2. **Live counters:** Display and update in real time: characters, words, lines, and bytes.
3. **Token counting:** Display token count for a selected model/provider.
4. **Accuracy labeling:** For each model, show a badge indicating “Exact” or “Estimated” based on offline tokenizer reliability.
5. **Pricing table:** Render a sortable, filterable, searchable table of models from `prices.json`, grouped by provider and ordered by release date where available.
6. **Cost calculation:** For each model row, show price per 1M tokens (input and output where applicable) and computed input cost for the current text.
7. **Last updated:** Display “Last updated” based on `prices.json` metadata.
8. **Smart paste:** Provide a toggle to normalize newlines, remove duplicate spaces, and trim edges; enabled by default.
9. **Export:** Allow exporting results to CSV and JSON.
10. **Copy summary:** Provide a one-click “Copy summary” to clipboard.
11. **Text presets:** Provide 3 presets (e.g., short paragraph, multi-line instructions, JSON sample) to populate the textarea.
12. **Offline ready:** App loads and works with no network access after initial static asset load.
13. **Accessibility:** Full keyboard navigation for all interactive elements; ARIA labels for form controls and tooltips.
14. **Mobile responsiveness:** Layout adapts to mobile; table is horizontally scrollable with sticky header.

## Non-functional requirements
- **Performance:**
  - Input-to-counter update under 50ms for up to 50k characters on mid-tier hardware.
  - Table operations (sort/filter/search) under 100ms for up to 300 model rows.
- **Accessibility:**
  - WCAG 2.1 AA for contrast, focus states, and keyboard navigation.
- **Privacy:**
  - No data leaves the browser; no analytics or tracking by default.
- **Offline capability:**
  - App functions with no network after initial load; all tokenizers and data are bundled.
- **Security:**
  - No remote script execution; CSP-friendly static bundle.

## UX flows + information architecture
### Primary flow: Estimate cost
1. User lands on page and sees textarea, counters, token selector, and pricing table.
2. User pastes or types text (smart paste normalization applied if toggle on).
3. Counters update live; token count updates for selected model.
4. Pricing table updates input cost for each model row.
5. User filters/sorts table to compare models.
6. User exports results or copies summary.

### Secondary flows
- **Change model:** User selects model in token counter dropdown to get model-specific token count and accuracy label.
- **Preset use:** User clicks preset to populate textarea and see immediate recalculations.
- **Inspect accuracy:** User hovers or focuses on “Exact/Estimated” badge to view tooltip.

### Information architecture (top-level sections)
1. **Header:** App title, short description, “Last updated”.
2. **Input panel:** Textarea, smart paste toggle, clear button, presets.
3. **Metrics panel:** Character/word/line/byte counters and token counter with accuracy badge.
4. **Results panel:** Copy summary, export buttons.
5. **Pricing table:** Search, filter, sort controls and model list.
6. **Footer:** Sources and privacy statement.

## UI layout spec
### Desktop
- Two-column layout:
  - Left column: Input panel + Metrics panel.
  - Right column: Results panel + Pricing table.
- Sticky table header and left-aligned provider grouping.
- Export and copy controls above the table.

### Mobile
- Single-column stacked layout:
  - Input panel → Metrics panel → Results panel → Pricing table.
- Pricing table horizontally scrollable with sticky header.
- Floating “Clear” and “Copy summary” actions optional but must remain accessible.

## Edge cases
- **Unicode:** Properly count multi-byte characters and emoji in byte count; word count should use Unicode-aware segmentation.
- **Very long text:** Handle up to 200k characters without UI freezing; use debounced rendering if necessary.
- **Newline normalization:** Support CRLF and LF; smart paste toggle should standardize to LF.
- **Empty input:** Costs display as $0.00 with clear “No input” or 0 tokens.
- **Invalid prices.json:** Show a user-friendly error state and fall back to an empty table.

## Success metrics
- **Functional completeness:** All functional requirements demonstrably implemented in UI.
- **Accuracy clarity:** 100% of models display an accuracy badge and tooltip.
- **Performance:** Counters update within 50ms for 50k characters on mid-tier devices.
- **Usability:** Users can complete a cost estimate in under 30 seconds without help.
- **Data transparency:** Sources and “Last updated” are visible on page.

