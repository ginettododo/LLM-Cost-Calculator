# Agent Rules & Guardrails

## Absolute Constraints
- **No backend**: never add servers, serverless functions, or databases.
- **No paid APIs**: do not introduce paid services or API calls.
- **No LLM calls**: the app must run entirely offline.
- **Static only**: all features must work in a static Vercel deploy.

## Core Engineering Rules
- Keep dependencies minimal and justified.
- Use strict TypeScript throughout.
- Prefer pure functions in `/src/core`.
- Core must not import UI modules.
- Never silently fail schema validation; always show a clear error UI.

## Token Counting Rules
- Use pluggable `TokenProvider` pattern.
- OpenAI provider must be **Exact** using a local tokenizer library.
- Other providers may be **Estimated** and must include visible notes/tooltips.
- Always label exactness in the UI.

## UX/Behavior Rules
- Debounce text input updates.
- Lazy-load tokenizer modules per provider selection.
- Handle large text safely and predictably.
- No analytics or tracking by default.

## Data Rules
- `prices.json` is local and imported at build-time.
- Validate `prices.json` at startup with a schema validator (e.g., Zod).

## Testing & Quality Gates
- Linting + formatting required.
- Unit tests for core logic are mandatory.
- Snapshot tests for token counts (minimum for OpenAI provider).
- Optional minimal e2e smoke test.

## DX Rules
- Keep steps small and deterministic.
- Avoid large refactors without justification.
- Add tooltips for estimated counts.
