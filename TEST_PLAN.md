# Test Plan

## Objectives
- Ensure deterministic and correct token counts and cost calculations.
- Validate schema and data handling.
- Prevent regressions in UI labeling for exact vs estimated results.

## Quality Gates
1. **Linting & Formatting**
   - Run ESLint and formatter on every change.
2. **Unit Tests (Core)**
   - Text normalization
   - Token provider registry
   - Cost computation
   - Schema validation for `prices.json`
3. **Snapshot Tests (Token Counts)**
   - Required: OpenAI provider exact tokenizer snapshots
   - Optional: Estimated provider snapshots with explicit notes
4. **E2E Smoke Test (Optional, Minimal)**
   - Load app
   - Enter text
   - Select provider
   - Confirm tokens and cost render

## Suggested Coverage Matrix
- Small/medium/large text inputs
- Unicode and mixed-language cases
- Empty and whitespace-only input
- Invalid `prices.json` handling
- Provider selection with lazy-loaded tokenizer

## Non-Goals
- No network tests or API mocking (static app).
- No performance benchmarking beyond basic smoke checks.

## Reporting
- Test output should be deterministic and CI-friendly.
- Failures must be actionable and point to the responsible module.
