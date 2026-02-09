# UX_SPEC — Token & LLM Cost Calculator

## Component list
1. **Textarea**
   - Large, resizable input area.
   - Placeholder copy: “Paste or type text to estimate tokens and cost.”
   - Clear button and character limit hint (soft, not enforced).
2. **Counters**
   - Live counters for characters, words, lines, bytes.
   - Displayed in a grid with labels and values.
3. **Model selector**
   - Dropdown for provider/model selection.
   - Adjacent token count display and accuracy badge.
4. **Pricing table**
   - Provider grouping with model rows.
   - Columns: Provider, Model, Release Date, Input $/1M, Output $/1M, Accuracy, Cost (input).
   - Search, filter, and sort controls.
5. **Results panel**
   - Export to CSV/JSON.
   - Copy summary to clipboard.
   - “Last updated” display for pricing data.
6. **Smart paste toggle**
   - Default on; labeled “Normalize text (trim, de-dup spaces, normalize newlines)”.
7. **Presets**
   - Buttons: “Short paragraph”, “Multiline instructions”, “JSON sample”.

## Interaction states
### Textarea
- **Empty:** Show placeholder and disable “Clear”.
- **Active typing:** Live counter updates and cost recalculation.
- **Large input (>50k chars):** Show “Large input mode” hint and apply lightweight debouncing.

### Tokenization state
- **Loading tokenizer:** Show inline spinner and “Loading tokenizer…” with ARIA live region.
- **Exact:** Green badge labeled “Exact” with tooltip.
- **Estimated:** Yellow badge labeled “Estimated” with tooltip.

### Pricing table
- **Default:** All models visible, grouped by provider.
- **Filtered:** Show “x results” count and allow clear filters.
- **No results:** Empty state with “No models match your filters.”

### Error states
- **Invalid prices.json:** Display banner “Pricing data unavailable. Please check prices.json.” and hide table rows.
- **Tokenizer unavailable:** Fall back to estimated tokens with warning message.

## Microcopy rules
1. **Accuracy badge tooltip:**
   - Exact: “Exact: Tokens counted with an offline tokenizer that matches the provider’s model.”
   - Estimated: “Estimated: Token count is approximated and may differ from provider results.”
2. **Smart paste toggle helper:** “Normalizes whitespace and newlines for consistent counts.”
3. **Export success:** “Exported results to CSV/JSON.”
4. **Copy success:** “Summary copied to clipboard.”
5. **Privacy note:** “All text stays in your browser—nothing is sent to a server.”
6. **Last updated label:** “Pricing data last updated: {date}.”

## Accessibility requirements
- Keyboard focus order: Input → toggles → counters → model selector → results → table controls → table rows.
- All interactive controls must be reachable via keyboard.
- Tooltips must be accessible via focus (not hover only) with ARIA-describedby.
- Table rows must be readable by screen readers with correct headers.

