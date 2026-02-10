export type PresetDefinition = {
  id: string;
  label: string;
  value: string;
  length: number;
  approxLabel: string;
};

const SHORT_PRESET =
  "Quick note: The team wants a fast, local cost estimate before approving a prompt. " +
  "Use visible rows mode for normal inputs, and switch to primary model mode when pasting " +
  "huge drafts. The goal is clarity, not perfection, and a smooth experience matters more " +
  "than fancy visuals.";
// Length: 275 chars.

const LONG_ARTICLE_PRESET = `# Roadmap: A 5,000-Character Product Narrative

## 1. Why this initiative exists
A reliability effort starts with a clear statement of user pain. Teams kept reporting that cost estimates arrived too late in the sprint, after architecture decisions were already locked. The goal of this initiative is to bring token cost visibility into the earliest planning conversations so stakeholders can balance scope, quality, and budget before code is written.

The product should feel like a calm, reliable notebook. It should accept messy drafts, recognize when inputs are massive, and remain responsive even when a user pastes a multi-page report. We want users to leave with the sense that the calculator is steady, predictable, and honest about its accuracy.

## 2. What success looks like
Success is not only accuracy; it is consistency under load. We want to show that the UI still responds in under a second with 50,000 characters, and that it communicates clearly when it has to switch into a faster computation mode. The presence of long-form presets also makes the tool easier to evaluate in demos and onboarding sessions.

A successful release has three visible outcomes: the numbers match expected totals, the interface never jumps or flickers when filters change, and users always understand why a model is marked as "Estimated." Each of these outcomes can be tested with a preset, a consistent dataset, and a checklist that product and QA can follow without additional tools.

## 3. Scope and focus
The scope is intentionally narrow: client-side computation, no external APIs, and no persistence. This lets the experience be fast, private, and low-risk. The calculator should be easy to audit because all logic runs inside the browser, and pricing data is shipped as static JSON.

### In scope
- Token estimation and exact counts where a tokenizer is available
- Cost computation for input and output tokens
- Presets for short, long, and structured text scenarios
- Transparent indicators for exactness and currency
- Friendly error panels when data validation fails

### Out of scope
- Server-side storage or analytics
- User accounts or paid integrations
- Model fine-tuning or content generation
- Real-time collaboration

## 4. Delivery plan
The release is organized into three milestones. Milestone one stabilizes the UI, including loading states and empty tables. Milestone two brings the new presets, computation modes, and cache tuning. Milestone three focuses on documentation, a QA checklist, and small regression tests that protect the most common flows.

## 5. User story spotlight
Imagine a PM pasting a strategy memo with nested bullets and mixed unicode characters. The calculator should display the character count instantly, switch to primary-only mode if needed, and still allow the PM to undo a preset choice without losing the original draft. The tool should never appear to stall; instead, it should tell the user that processing is in progress and show which rows are ready.

## 6. Risk mitigation
The most likely failure is not a crash; it is confusion. We mitigate this by using a help popover that explains "Exact" vs "Estimated" and by showing a warning when the input size crosses thresholds. Another risk is stale data, so the UI always surfaces the last updated timestamp for pricing data.

## 7. Review checklist
Before shipping, we run a short review checklist with both QA and product:
1. Paste in each preset and confirm counts update without a full page freeze.
2. Toggle filters and ensure the empty state is readable and calm.
3. Export CSV and JSON and verify numbers are consistent with the table.
4. Attempt to copy the summary while clipboard access is blocked.
5. Validate that the UI reports a helpful message if pricing data is invalid.

## 8. FAQ
**Q: Why are some counts estimated?**
A: When a tokenizer is unavailable, we estimate using a character heuristic. The UI always labels these rows as Estimated and explains why.

**Q: Why are there warning banners?**
A: Large inputs can slow down the browser. We show warnings early so users understand why the app might enter a faster computation mode.

**Q: Can we store history?**
A: Not in this release. The experience is intentionally local and stateless.

## 9. Appendix: evaluation metrics
We track median time-to-first-result, table interaction latency, and error-free session rates. Qualitative feedback focuses on clarity: can a new user explain the meaning of Exact vs Estimated after one minute? These metrics keep the project grounded in reliability, not just new features. We also monitor memory usage during large inputs to avoid browser freezes.

## 10. Closing notes
We are building trust. The calculator should never crash on malformed data, should be honest about estimation, and should prioritize smooth interactions when users paste large text. A trustworthy tool is the one that keeps its promises even when stressed. The experience should feel dependable on every paste.`;
// Length: 4990 chars.

const VERY_LONG_ARTICLE_PRESET = `# Reliability Field Guide: Building a 10,000-Character Report

## Executive summary
This report describes how a client-side LLM cost calculator can remain dependable under heavy inputs. It focuses on predictable behavior, transparent communication, and thoughtful defaults. While the product is intentionally simple, the surrounding guidance is detailed so that new contributors can maintain a consistent standard for quality and performance.

## 1. Background and goals
Product teams are increasingly asked to quantify the cost of long prompts, transcripts, or code review sessions. The cost calculator exists to serve that need without requiring backend services. The goals are straightforward:
- Keep everything static and local in the browser.
- Avoid surprises by labeling accuracy clearly.
- Remain responsive even when users paste extremely large inputs.

We define reliability as the ability to deliver stable, repeatable results regardless of input size or tokenization mode. That means no crashes, no unbounded memory growth, and no confusing UI states when data is missing or filters are applied.

## 2. Personas and workflows
### 2.1 The product manager
The PM works in long documents. They paste a full PRD, add a small clarification, and check cost impact. They need the app to stay smooth, to surface the primary model quickly, and to provide a clear warning if full-table computation is too expensive.

### 2.2 The engineer
The engineer uses the calculator during code review. They want a quick estimate for a single model and sometimes compare across providers. They need a fast mode that prioritizes one model while still allowing the full table in smaller scenarios.

### 2.3 The researcher
The researcher tries many model names and runs filters repeatedly. Search should be forgiving, and sorting should remain stable even when some models lack optional metadata like release dates.

## 3. Accuracy policy
We define two accuracy levels:
1. **Exact** — A tokenizer-backed count is available for the model. The calculator should use that tokenizer and report "Exact".
2. **Estimated** — A tokenizer is unavailable. The calculator should use a simple character-based heuristic and report "Estimated".

When in doubt, the UI should err on the side of clarity, not confidence. If a model is marked as exact but the tokenizer fails, the UI must fall back to estimated and show the estimated label to the user.

## 4. Data validation
Pricing data is shipped as JSON. Validation must happen at runtime so that schema issues are surfaced as a friendly panel rather than a crash. The panel should list the number of issues and provide the most relevant errors first. It should also encourage the user to refresh data or report the issue with a link to the repository.

## 5. Computation modes
The app supports two computation modes:
- **Visible rows** (default): compute token counts for the rows that are currently visible after filtering and search.
- **Primary model only**: compute only the first visible row to keep the UI responsive on very large inputs.

This mode selection must be explicit, keyboard accessible, and accompanied by a brief explanation. When the input exceeds a high threshold, the app should force primary-only mode to prevent browser freezes.

## 6. Input size thresholds
We set two thresholds based on experience:
- 50,000 characters: display a caution banner and suggest switching to primary-only mode.
- 200,000 characters: show a stronger warning, automatically switch into primary-only mode, and temporarily disable multi-row computation.

The banners are not meant to shame the user. Instead, they are a transparent, reassuring signal that the app is still healthy and is making choices to protect performance.

## 7. Presets as reliability tests
Presets are more than convenience; they are regression tools. Each preset is a deterministic string with a documented length. By keeping the content stable, the team can compare token counts over time and ensure that UI changes do not unintentionally alter results.

### Preset checklist
- One short preset under 500 characters.
- Multiple long-form presets with structured text.
- A code sample with valid JSON and TypeScript.
- A mixed-unicode sample with emoji, accents, CJK, and RTL text.
- A prompt-like instruction block that mimics real LLM usage.

## 8. Interaction details
### 8.1 Clipboard fallback
When clipboard access is denied, the app should attempt a legacy copy method and, if that fails, reveal the content in a selectable area. Every user should be able to recover the summary text, even in restrictive environments.

### 8.2 Undo behavior
Preset application replaces the text. The last replacement must always be undoable. The UX should present a toast with an Undo action as well as an always-available "Undo last preset" button for keyboard access.

### 8.3 Search and sorting
Search should match both provider and model names, ignore extra spaces, and avoid oscillating sort states. Sorting should be stable, handle undefined values gracefully, and avoid treating missing output pricing as zero dollars.

## 9. Performance safeguards
We use a small LRU cache keyed by the model identifier and a stable hash of the text. This reduces repeated tokenizer work when the user toggles filters or changes sorting without editing the text. Tokenization should run in small batches to avoid blocking the main thread.

A reliable interface remains interactive even when a large input is pasted. Progressive computation ensures that the first row appears quickly, which is crucial when the primary model is the only data the user needs.

## 10. Export and reporting
Exports include metadata such as character counts and last update timestamps. All currency values should be rounded consistently and formatted according to the user's locale. If a value is not finite, the UI should show a placeholder rather than "NaN".

## 11. Accessibility considerations
We use labeled controls, consistent focus order, and keyboard-triggered popovers. Toast actions are buttons, not links, to ensure they are focusable and discoverable. Help text lives near the control it describes so that screen readers can pick it up in context.

## 12. Implementation notes
The UI is composed of reusable cards, toggles, and tables. State is kept local and small. Avoid optional chaining in critical paths when it would mask data issues; instead, surface the error with a friendly panel so that the user can respond.

## 13. Example workflow walkthrough
1. Open the app and select the "Very long article" preset.
2. Notice the banner warning about size and switch to primary-only mode.
3. Filter to a specific provider and confirm the primary model updates.
4. Open the help popover to verify the accuracy policy.
5. Copy the summary and then undo the preset to restore the original draft.

## 14. Appendix: sample template
Below is a condensed template for an internal QA run:
- Apply each preset and confirm counts update within two seconds.
- Confirm export results match the on-screen values.
- Disable clipboard permissions and confirm fallback copy works.
- Validate that the pricing error panel appears when data is malformed.
- Review the computation mode toggle for correct labels.

## 15. Case study: launch week
During launch week, the team ran a 60,000-character policy draft through the calculator multiple times. The first run highlighted a significant cost spike for high-output models. A PM used primary-only mode to isolate the best-fit option, while the engineer filtered by provider to confirm exact tokenization was available. The result was a faster decision cycle and higher confidence in budget estimates.

## 16. Troubleshooting guide
If counts appear too low, confirm the correct model is selected and check whether it is marked "Estimated." If costs appear as dashes, verify that the pricing data is loaded and that the currency is USD. If the UI feels sluggish, reduce the input size or switch to primary-only mode. The goal is always to keep the experience responsive without hiding information from the user.

## 17. Common questions from stakeholders
Stakeholders often ask if the calculator can be embedded elsewhere. The answer is yes, but only if the host respects the static, offline constraint. Another common request is to store a history of inputs; that remains out of scope in order to protect privacy and keep the surface area small.

## 18. Maintenance plan
Maintenance is lightweight: update pricing data, run the test suite, and verify that the presets still behave as expected. Every change should be accompanied by a quick pass through the large input warning thresholds to ensure that performance safeguards remain intact.

## 19. Metrics dashboard draft
| Metric | Target | Notes |
| --- | --- | --- |
| Time to first row | < 1s | With a 50k input on a modern laptop |
| Full table compute | < 3s | For visible rows under normal sizes |
| Input warning accuracy | 100% | Banner appears exactly at thresholds |
| Clipboard fallback | 100% | Works in locked-down environments |

## 20. Migration notes
If the pricing schema changes, update the validation layer first, then update UI labels. Keep a minimal migration guide in the README. Avoid automatic migrations in the browser; instead, ship a new JSON file and verify it with tests.

## 21. Reflection
The app's strength is its simplicity. By concentrating on reliability and a handful of essential workflows, it earns user trust. Every new feature should be assessed against that standard: does it make the experience calmer, clearer, and more dependable? We treat each warning as a promise, and every preset as a rehearsal for real-world usage. If the tool feels predictable, the user feels in control. That sense of control is the product.

## 22. Closing
Reliability is not a single feature. It is the sum of small decisions: defensive defaults, honest labels, and a UI that never surprises the user.`;
// Length: 9976 chars.

const CODE_SAMPLE_PRESET = `// Example payload (JSON)
{
  "project": "llm-cost-calculator",
  "version": "2.0.0",
  "env": "local",
  "features": {
    "export": true,
    "clipboardFallback": true,
    "presets": true,
    "computeModes": ["visible-rows", "primary-model"],
    "warnings": {
      "softThreshold": 50000,
      "hardThreshold": 200000
    }
  },
  "models": [
    {
      "id": "openai:gpt-4o",
      "provider": "OpenAI",
      "modality": "text",
      "pricing": { "input": 5.0, "output": 15.0 }
    },
    {
      "id": "anthropic:claude-3-5-sonnet",
      "provider": "Anthropic",
      "modality": "text",
      "pricing": { "input": 3.0, "output": 15.0 }
    }
  ],
  "owner": {
    "team": "frontend-platform",
    "slack": "#cost-tools"
  }
}

// Example client utilities (TypeScript)
export type PricingModel = {
  id: string;
  provider: string;
  modality: "text" | "audio" | "realtime" | "multimodal";
  inputPerMTok: number;
  outputPerMTok?: number;
};

export type ComputationMode = "visible-rows" | "primary-model";

export type CostSummary = {
  modelId: string;
  tokens: number;
  inputCostUSD: number;
  outputCostUSD: number;
  totalCostUSD: number;
  accuracy: "exact" | "estimated";
};

export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const computeCost = (
  tokensIn: number,
  tokensOut: number,
  model: PricingModel,
): CostSummary => {
  const inputCostUSD = (tokensIn / 1_000_000) * model.inputPerMTok;
  const outputCostUSD = model.outputPerMTok
    ? (tokensOut / 1_000_000) * model.outputPerMTok
    : 0;
  return {
    modelId: model.id,
    tokens: tokensIn,
    inputCostUSD,
    outputCostUSD,
    totalCostUSD: inputCostUSD + outputCostUSD,
    accuracy: "estimated",
  };
};

export const summarize = (
  text: string,
  models: PricingModel[],
  mode: ComputationMode,
): CostSummary[] => {
  const target = mode === "primary-model" ? models.slice(0, 1) : models;
  return target.map((model) => computeCost(estimateTokens(text), 0, model));
};

export const safeCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(value);
};

// A tiny LRU cache helper
export class LruCache<K, V> {
  private readonly limit: number;
  private readonly map = new Map<K, V>();

  constructor(limit = 50) {
    this.limit = limit;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.limit) {
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
  }
}

const tokenCache = new LruCache<string, number>(100);

export const cachedEstimate = (text: string, modelId: string): number => {
  const key = modelId + \":\" + text.length + \":\" + text.slice(0, 24);
  const cached = tokenCache.get(key);
  if (cached !== undefined) return cached;
  const tokens = estimateTokens(text);
  tokenCache.set(key, tokens);
  return tokens;
};

// Example usage
const sampleText = "Ship reliability fixes for the calculator.";
const models: PricingModel[] = [
  { id: "openai:gpt-4o", provider: "OpenAI", modality: "text", inputPerMTok: 5, outputPerMTok: 15 },
  { id: "mistral:large", provider: "Mistral", modality: "text", inputPerMTok: 2.5 },
];

const summaries = summarize(sampleText, models, "visible-rows");
console.log(summaries.map((item) => safeCurrency(item.totalCostUSD)).join(", "));
`;
// Length: 3757 chars.

const MIXED_UNICODE_PRESET = `# Mixed Unicode Stress Test

## Latin accents and symbols
Résumé, café, jalapeño, coöperate, voilà. Prices: €12,50 • £9.99 • $7.50. Math: 3 × 7 = 21, and 5 ÷ 2 = 2.5.

## Emoji and pictographs
Daily status: ✅ Done, ⚠️ Risk, ❌ Blocked. Celebrations: 🎉🥳✨. Travel: ✈️🚄🚗🚲. Nature: 🌲🌸🌊. Astronauts: 👩‍🚀👨‍🚀. Family: 👩‍👩‍👧‍👦.

## CJK samples
Chinese: 这是一个稳定性测试，用来检查字符计数是否一致。
Japanese: こんにちは、トークン数の推定を確認します。長い文章でも落ち着いて表示されるべきです。
Korean: 안녕하세요. 이 입력은 다양한 언어가 섞여도 정상적으로 동작하는지 확인합니다.

## RTL snippet
Arabic: مرحبًا بك في اختبار النص المختلط، حيث نتحقق من الاستقرار والوضوح.
Hebrew: בדיקה קצרה של טקスト דו־כיווני כדי לוודא שאין שיבושים בתצוגה.

## Combining marks and punctuation
ñäïve — côte d’ivoire — piñata. Quotes: “smart” vs 'plain'. Dashes: – — —. Ellipsis…

## Long-form paragraph
The goal is not just to see characters render, but to ensure that counters, token estimation, and UI formatting remain consistent. Mixed scripts can reveal invisible errors, like misplaced trimming or incorrect byte counts. When a user pastes a multi-language report or a chat log with emoji reactions, the calculator must still feel calm and predictable.

Another scenario: a product brief includes bilingual sections and inline emoji reactions. The app should keep its spacing, avoid corrupting right-to-left segments, and count graphemes consistently. It should never collapse lines or reorder glyphs when normalization is off.

## Extra lines for length
Line 01: Δοκιμή ελληνικών χαρακτήρων.
Line 02: Svenska åäö och norsk æøå.
Line 03: Español con ¿preguntas? y ¡exclamaciones!
Line 04: Français avec « guillemets ».
Line 05: Português com ç e ã.
Line 06: Türkçe İ, ı, ş, ğ.
Line 07: Polski ąęłńśźż.
Line 08: Čeština čřžě.
Line 09: Українська мова — перевірка.
Line 10: हिन्दी परीक्षण, देवनागरी लिपि.
Line 11: বাংলা ভাষা পরীক্ষা।
Line 12: ภาษาไทยทดสอบการนับอักขระ
Line 13: Tiếng Việt có dấu.
Line 14: Íslenska með ð og þ.
Line 15: Gaeilge le ponc séimh.
Line 16: Māori with macrons: āēīōū.
Line 17: Latin ligatures: æ œ.
Line 18: Symbols: © ™ ® § ¶ •
Line 19: Emojis in line: 🤖📦🧪🧭
Line 20: Mixed RTL/LTR: ABC مرحبا 123 שלום.`;
// Length: 2109 chars.

const PROMPT_BLOCK_PRESET = `SYSTEM
You are a helpful assistant embedded in a cost estimation tool. Your job is to provide structured, reliable analysis without hallucinating missing data. If a field is unknown, say "unknown" and move on.

USER
We are preparing a quarterly planning memo. Please analyze the following draft and return a structured report. Use the exact headings provided, keep the tone professional, and do not add external references.

DRAFT INPUT
# Draft: Q3 Initiative Memo

## Overview
We want to reduce the time it takes for product teams to understand LLM usage costs. The memo should outline why this matters, what we're building, and how we will measure success. We will also include a small launch checklist.

## Notes
- Reliability and smooth UX are the top priorities.
- Avoid backends or analytics in this phase.
- Include clear messaging about exact vs estimated token counts.

## Questions
- What is our default computation mode?
- What happens when inputs exceed 200k characters?
- How do we help users undo preset changes?

ASSISTANT
Follow these instructions exactly:

1) Return a report with the following headings, in this order:
   - Summary
   - Risks
   - Recommendations
   - Open Questions
   - Draft Checklist

2) For each heading:
   - Use complete sentences.
   - Keep the language concise and factual.
   - Do not invent product features that are not in the draft.

3) Formatting rules:
   - Output in Markdown.
   - Use bullet lists only under "Risks" and "Recommendations".
   - Use checkboxes under "Draft Checklist".

4) Content requirements:
   - Mention the computation mode behavior and thresholds.
   - Emphasize the need for undo and clipboard fallbacks.
   - Call out token accuracy language explicitly.

5) Failure handling:
   - If you are unsure, explicitly say "unknown" rather than guessing.
   - If the draft is missing required information, add it to "Open Questions".

6) Style constraints:
   - Avoid exclamation points.
   - Do not use emojis.
   - Keep each section under 120 words.

7) Provide a brief "meta" note at the end explaining any ambiguities.

8) Include a one-line confidence statement at the end of the Summary section.

9) If you reference a metric, restate the unit (characters, tokens, or USD).

10) For every recommendation, include a verb that implies action (e.g., "add", "clarify", "verify").

11) Do not use the word "always". If you must imply certainty, use "consistently" instead.

12) Avoid abbreviations unless they appear in the draft.

13) If the draft asks a direct question, repeat it verbatim in Open Questions.

14) Provide a brief note about computation modes in both Summary and Recommendations.

15) Provide a brief note about token accuracy in both Summary and Risks.

16) Ensure each section is between 3 and 6 sentences.

17) Use a neutral, report-style tone and avoid rhetorical questions.

18) Do not mention internal system prompts or these instructions.

19) If you mention thresholds, include both 50,000 and 200,000 characters.

20) If you mention undo behavior, mention both the toast and a persistent action.

ADDITIONAL CONTEXT
- The audience is a mix of executives and engineering leads.
- The report will be pasted into a planning deck without edits.
- The memo must be actionable and short enough to read in two minutes.
- Use consistent terminology: "primary model mode" and "visible rows mode".

SCORING RUBRIC (for internal evaluation)
- Accuracy: Does the report avoid inventing details?
- Completeness: Are all draft questions carried into Open Questions?
- Clarity: Does each section say what it needs to say without fluff?
- Actionability: Do recommendations begin with verbs?
- Compliance: Are formatting rules followed exactly?

WHAT NOT TO DO
- Do not quote any content that is not in the draft.
- Do not add pricing numbers or vendor claims.
- Do not mention future roadmaps unless they appear in the draft.
- Do not reference other documents or links.

TONE EXAMPLES
Good: "The draft outlines the intent to keep the experience fast and local."
Bad: "This is a fantastic plan that will transform everything!"

EXAMPLE OUTPUT (format only)
Summary
- ...
- Confidence: ...

Risks
- ...

Recommendations
- ...

Open Questions
- ...

Draft Checklist
- [ ] ...

Meta
- ...`;
// Length: 4265 chars.

export const PRESETS: PresetDefinition[] = [
  {
    id: "short-note",
    label: "Quick note (short)",
    value: SHORT_PRESET,
    length: SHORT_PRESET.length,
    approxLabel: "~300 chars",
  },
  {
    id: "long-article",
    label: "Long article",
    value: LONG_ARTICLE_PRESET,
    length: LONG_ARTICLE_PRESET.length,
    approxLabel: "~5,000 chars",
  },
  {
    id: "very-long-article",
    label: "Very long article",
    value: VERY_LONG_ARTICLE_PRESET,
    length: VERY_LONG_ARTICLE_PRESET.length,
    approxLabel: "~10,000 chars",
  },
  {
    id: "code-sample",
    label: "Code sample (JSON + TS)",
    value: CODE_SAMPLE_PRESET,
    length: CODE_SAMPLE_PRESET.length,
    approxLabel: "~3,800 chars",
  },
  {
    id: "mixed-unicode",
    label: "Mixed unicode stress test",
    value: MIXED_UNICODE_PRESET,
    length: MIXED_UNICODE_PRESET.length,
    approxLabel: "~2,100 chars",
  },
  {
    id: "prompt-block",
    label: "Prompt-like instruction block",
    value: PROMPT_BLOCK_PRESET,
    length: PROMPT_BLOCK_PRESET.length,
    approxLabel: "~4,300 chars",
  },
];
