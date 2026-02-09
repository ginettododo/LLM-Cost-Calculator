# Repository Structure

## Top-Level Layout
- `README.md` — project overview, setup, and usage.
- `ARCHITECTURE.md` — system architecture and design decisions.
- `REPO_STRUCTURE.md` — this document.
- `RULES.md` — agent rules and guardrails.
- `TEST_PLAN.md` — testing strategy and gates.
- `PROGRESS.md` — milestone checklist and status.
- `src/` — application source.
- `public/` — static assets.
- `tests/` — unit and snapshot tests.

## Source Tree (Planned)
- `src/main.tsx` — app entry.
- `src/app/` — app shell, routing (if any), top-level providers.
- `src/core/` — pure logic and domain rules.
  - `normalization/` — text cleanup and preprocessing.
  - `tokenizers/` — tokenizer loading, provider registry.
  - `pricing/` — cost computation and formatting.
  - `schema/` — price schema and validation helpers.
  - `types/` — core types and interfaces.
- `src/ui/` — UI components and state.
  - `components/` — reusable UI pieces.
  - `views/` — screens and layout.
  - `state/` — state management utilities.
  - `styles/` — UI styling.
- `src/data/` — local data assets.
  - `prices.json` — static pricing data (validated on startup).

## Testing (Planned)
- `tests/core/` — unit tests for core functions.
- `tests/snapshots/` — snapshot tests for token counts.
- `tests/e2e/` — basic smoke tests (optional, minimal).

## Rationale
- Clear separation between **core logic** and **UI** supports deterministic testing.
- `src/data` keeps build-time imports localized.
- Tests mirror the `src/core` module boundaries.
