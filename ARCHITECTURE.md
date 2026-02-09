# Architecture

## Goal
Deliver a fully static, privacy-first Token & LLM Cost Calculator that runs entirely in the browser with deterministic, testable core logic and a clean UI separation.

## Tech Stack Choice (brief)
**Chosen: Vite + React + TypeScript**
1. Fast dev/build with minimal configuration.
2. Small bundle + easy static deploy to Vercel.
3. No framework-specific server or export constraints.
4. Simple lazy-loading for tokenizer modules.
5. Straightforward unit testing setup for pure core functions.
6. Excellent DX for strict TypeScript + lint/format.

## Architectural Overview
- **Core Engine** (`/src/core`): Pure, deterministic functions for normalization, token counting, pricing, and validation.
- **UI** (`/src/ui`): Components, state management, layout, and user interactions.
- **Data** (`/src/data/prices.json`): Local pricing data imported at build-time.

### Module Boundaries
- Core must not import UI.
- UI can import core.
- Tokenizers are lazily imported by provider selection to reduce initial load.

## Key Data Flow
1. UI collects input text, model/provider selection, and pricing options.
2. Core normalizes text and delegates to selected `TokenProvider`.
3. Token count result + exactness drives cost computation and UI labeling.
4. Prices are validated at startup; invalid schema triggers a friendly error screen.

### Pseudocode (non-code diagram)
- UI input → normalize(text) → provider.countTokens(text)
- provider result → computeCost(tokens, price)
- UI render: tokens, cost, exactness badge + tooltip

## Token Providers Pattern
Interface contract:
- `id`: stable identifier
- `label`: human-readable name
- `countTokens(text)` returns `{ tokens, exactness, notes }`

Exactness:
- `Exact`: verified local tokenizer (OpenAI provider)
- `Estimated`: heuristic tokenizer with visible note/tooltip

## Data Validation Strategy
- `prices.json` is parsed and validated against a schema at app startup.
- On failure, show a clear, non-dismissable error UI explaining the issue and how to fix it.
- Validation never fails silently.

## Performance Considerations
- Debounce text input updates.
- Lazy-load tokenizer modules per provider selection.
- Handle large text by chunking where safe and by avoiding excessive re-renders.
- Keep core functions pure and side-effect free for easy testing and memoization.

## Privacy Guarantees
- No network calls required for core operation.
- No analytics by default.
- All computation occurs locally in the browser.

## Observability (Local Only)
- Optional debug flag for console logs in development only.
- No remote logging or telemetry.

## Error Handling
- Schema validation errors: dedicated UI state with actionable message.
- Tokenizer load failures: UI fallback explaining missing provider with safe defaults.

## Future Extension Points
- Add new token providers by implementing the interface.
- Add price tiers via validated `prices.json` updates.
- Add new UI views (comparison, batch runs) without core changes.
