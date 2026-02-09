# Progress & Milestones

## v1 Release Readiness
- [x] Vite + React + TypeScript app scaffolded
- [x] Repo structure aligned with core/UI/data separation
- [x] Core normalization, counters, pricing, and schema validation implemented
- [x] Local pricing data file (`src/data/prices.json`) integrated
- [x] OpenAI exact tokenizer provider added (local `js-tiktoken`)
- [x] Estimated token path retained for non-OpenAI providers
- [x] UI supports input, live counters, token/cost table, export, summary copy, presets, and theme toggle
- [x] Debounced input updates active
- [x] Invalid pricing schema handling present in validation scripts

## Quality
- [x] ESLint + Prettier configured
- [x] Core unit tests expanded for normalization edge cases
- [x] UTF-8 byte counting tests expanded (unicode + emoji)
- [x] `computeCostUSD` rounding + missing output pricing tests added
- [x] OpenAI tokenizer snapshot tests added (5 representative strings incl. unicode)
- [x] Minimal smoke e2e test added (load app, paste text, cost visible)

## Performance & DX
- [x] Stable non-crypto text hashing implemented
- [x] LRU cache implemented for token counting (max 50 entries)
- [x] Large input warning added (50k+ chars)
- [x] `Primary model only` compute mode added for large inputs
- [x] UI responsiveness preserved via debounced input + bounded compute path

## Deployment & Ops
- [x] Static Vite output configuration verified for Vercel deployment
- [x] Vercel deployment steps documented with exact settings
- [x] Weekly GitHub Actions pricing updater added
- [x] Local pricing schema validation script added (`npm run prices:validate`)
- [x] Pricing canonicalization script added (`npm run prices:update`)

## Release Docs
- [x] `CHANGELOG.md` created with v1 notes
- [x] `SECURITY.md` added with static/local-only privacy model
- [x] `README.md` updated for deploy/test/pricing pipeline instructions
