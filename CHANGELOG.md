# Changelog

## [1.2.0] - 2026-02-11
### Major Refactoring
- **Performance**: Implemented a **5,000 token rendering cap** in `TokenHighlighter` to prevent DOM overload on large texts. Truncation warning added. This solves the "broken/slow" feel on large files.
- **Architecture**: Simplified `useTokenStats.ts` by removing dead `AbortController` code and redundant debouncing (latency reduced by ~150ms).
- **UI/UX**:
    - Increased main content max-width to **1200px** for better use of screen real estate.
    - Adjusted grid proportions on desktop (Editor vs Results) for a more balanced layout.
    - Refined spacing and component hierarchy.

## [1.1.0] - 2026-02-11
### Performance
- **Critical Fix**: Tokenizer freezing resolved by migrating to Web Worker and optimizing byte scanning to O(N).
- **Architecture**: Removed global window references in `TextareaPanel`.

### Features
- **Output Cost**: Configurable Output Cost calculation (Ratio or Fixed amount).

### UI/UX
- **Polish**: Enhanced "Neon" aesthetic, removed `!important` overrides, and fixed sync issues between editor and highlighter.

## [1.0.0] - 2026-02-09
### Added
- OpenAI exact token counting path (local tokenizer) with snapshot coverage.
- Stable non-crypto text hashing and LRU caching (50-entry cap) for token count reuse.
- Large-input guardrail warning at 50k+ chars and `Primary model only` compute mode.
- Scheduled GitHub Actions pricing updater workflow with schema validation and commit-on-change behavior.
- Local pricing maintenance scripts: `prices:update` and `prices:validate`.
- Minimal smoke e2e test validating app load, paste-to-update, and cost rendering.
- Security/privacy documentation for static-only local computation.

### Changed
- `computeCostUSD` now rounds to stable precision for deterministic outputs.
- Vite configuration explicitly set to SPA mode with `dist` output.
- README deployment instructions updated for static Vercel deploy flow.

### Fixed
- CI install steps aligned with repository setup (`npm install` in workflows).
