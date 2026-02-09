# Contributing

Thanks for helping build the Token & LLM Cost Calculator. Please follow these agent rules when making changes:

## Agent Rules (excerpt from RULES.md)
- **No backend**: never add servers, serverless functions, or databases.
- **No paid APIs**: do not introduce paid services or API calls.
- **No LLM calls**: the app must run entirely offline.
- **Static only**: all features must work in a static Vercel deploy.
- Keep dependencies minimal and justified.
- Use strict TypeScript throughout.
- Core logic must remain pure and must not import UI modules.
- Validation errors must be visible (never silently fail).

If you are unsure, check `RULES.md` before proceeding.
