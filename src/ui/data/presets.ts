export type PresetDefinition = {
  id: string;
  label: string;
  value: string;
  length: number;
  approxLabel: string;
};

const fitToLength = (base: string, targetLength: number, filler: string): string => {
  if (base.length >= targetLength) {
    return base.slice(0, targetLength);
  }

  let value = base;
  while (value.length < targetLength) {
    value += filler;
  }
  return value.slice(0, targetLength);
};

const SHORT_PRESET =
  "Quick check: estimate this draft locally, compare visible rows first, then switch to primary model mode if the input becomes huge. Keep the decision focused on accuracy labels, latency, and expected USD cost before we share a recommendation.";
// Length: 241 chars.

const LONG_ARTICLE_PRESET_BASE = `# Product Reliability Brief

## Context
The team is building a static, browser-only calculator that helps writers and engineers estimate token usage and pricing before they commit to a model choice. The product succeeds when it remains stable with real-world, messy inputs and still communicates limits clearly. This document summarizes scope, priorities, and release expectations for a reliability-focused iteration.

## Problem statement
Current workflows rely on late-stage estimates and manual spreadsheets, which produce inconsistent decisions. Teams need an immediate estimate while drafting prompts, writing long articles, or testing structured payloads. They also need confidence that the numbers are understandable, especially when a model uses estimated rather than exact counting.

## Goals
1. Provide predictable token and cost estimates for visible pricing rows.
2. Keep interaction smooth when users paste large text blocks.
3. Explain the difference between exact and estimated token counts in plain language.
4. Prevent crashes from malformed pricing data by showing a friendly recovery panel.

## Constraints
- No backend services and no persistence layer.
- All pricing data is static and validated on the client.
- The interface should remain keyboard accessible for controls and actions.

## UX details
The input area should support paste normalization by default while leaving invisible-character stripping optional. Preset content should cover realistic writing, code snippets, unicode-heavy content, and prompt-like instruction formats. Undo should remain available after preset replacement through both a toast action and a persistent control.

## Performance notes
When input sizes become large, users should receive early warnings at defined thresholds. Computation mode should support visible rows by default and primary model mode for faster updates under heavy load. Progressive row processing and caching should minimize main-thread blocking.

## Validation and safety
Schema errors must never crash rendering. The interface should display a concise issue panel with actionable copy and at least a small sample of validation details. Copy-to-clipboard behavior should degrade gracefully when browser permissions are unavailable.

## QA checklist
- Validate all presets and confirm expected length ranges.
- Confirm sorting and filtering behavior with search terms and provider changes.
- Verify currency formatting does not show NaN or Infinity.
- Confirm export and summary copy still work during large input scenarios.

## Release recommendation
Ship once table interactions remain responsive, warnings appear at the intended thresholds, and regression tests cover key stability paths. Document computation modes and token accuracy policy directly in the README so product teams can self-serve onboarding.`;

const LONG_ARTICLE_PRESET = fitToLength(
  LONG_ARTICLE_PRESET_BASE,
  5003,
  "\n\n### Appendix note\nReliability depends on clear defaults, transparent labels, and defensive handling for unusual input patterns.",
);
// Length: 5003 chars.

const VERY_LONG_ARTICLE_PRESET_BASE = `# Operational Playbook: Very Long Reliability Report

## 1) Executive overview
This report documents a full reliability review for a static LLM cost calculator. The review covers behavior under normal usage, stress conditions, and malformed data scenarios. It is intended for product leadership, engineering, QA, and documentation owners.

## 2) User scenarios
Scenario A represents a product manager pasting a long narrative for budget review. Scenario B represents a developer pasting a JSON payload with TypeScript utilities to compare model families. Scenario C represents multilingual content with right-to-left snippets and emoji-heavy examples. Each scenario is evaluated for responsiveness, clarity, and recoverability.

## 3) Reliability principles
- Predictable output formatting.
- Explicit indication of estimate quality.
- Defensive handling of invalid states.
- Responsive rendering under load.

## 4) Data behavior
Pricing data is bundled as static JSON and parsed on startup. Validation issues are transformed into a user-facing panel rather than a runtime crash. This protects the main experience and gives QA immediate visibility into invalid fields.

## 5) Interaction behavior
Search, filtering, and sorting should compose cleanly. Provider filters should reset safely when available provider options change. Sorting should remain stable for missing release dates and optional output pricing values.

## 6) Input behavior
Paste normalization should reduce accidental formatting noise. Invisible character stripping should remain optional because some users intentionally preserve zero-width markers for test cases. Empty input should show calm guidance rather than an error-like state.

## 7) Computation behavior
Visible rows mode is the default for balanced detail and speed. Primary model mode intentionally narrows computation for large payloads. The app should suggest fast mode at 50,000 characters and enforce primary-only behavior at 200,000 characters.

## 8) Caching behavior
Token counting should use an LRU cache keyed by text hash and model identifier. Cache hits reduce repeated tokenizer work during sorting and filter changes. Cache size should be high enough for common review sessions while still bounded.

## 9) Accessibility behavior
Interactive controls should expose proper labels and support keyboard navigation. Undo actions should be available through a visible button and also through an action inside the toast message. Status updates should be announced in polite live regions without interrupting typing.

## 10) Export behavior
CSV and JSON export should reflect currently visible computed rows. Export metadata should include timestamp, counters, and data freshness context. Numeric values should remain deterministic and avoid locale-dependent delimiters.

## 11) Accuracy policy
Exact counts are preferred when tokenizer support is available. Estimated counts use a deterministic heuristic and should be labeled clearly at row level. Help text should describe this tradeoff in concise language.

## 12) Regression risks
Potential regressions include NaN cost display, stale selection for primary model, and silent clipboard failures. Additional risk appears when tokenizer initialization and UI updates race on large text. Tests should target these paths with lightweight but meaningful coverage.

## 13) Validation plan
Execute smoke tests for typing, pasting, filtering, and mode switching. Run focused unit tests for price validation errors, formatting guards, and tokenization fallback behavior. Build and lint should run cleanly before release.

## 14) Communication plan
README should enumerate all preset options with exact lengths and intended usage. It should also explain computation modes, warning thresholds, and the exact-versus-estimated policy. This reduces support overhead and helps new contributors validate behavior quickly.

## 15) Decision
Proceed with release once the app demonstrates stable interactions across short, long, and extreme inputs. Keep future scope limited to static enhancements unless product requirements change.
`;

const VERY_LONG_ARTICLE_PRESET = fitToLength(
  VERY_LONG_ARTICLE_PRESET_BASE,
  10012,
  "\n\n## Supplemental observation\nA stable calculator builds trust by being explicit about limits, deliberate about defaults, and graceful when assumptions fail.",
);
// Length: 10012 chars.

const CODE_SAMPLE_PRESET_BASE = `// config/sample.json
{
  "app": "llm-cost-calculator",
  "version": "2.1.0",
  "mode": "static",
  "thresholds": {
    "softChars": 50000,
    "hardChars": 200000
  },
  "defaults": {
    "normalizeOnPaste": true,
    "removeInvisibleChars": false,
    "computeMode": "visible-rows"
  },
  "models": [
    {
      "id": "openai:gpt-4o",
      "provider": "OpenAI",
      "inputPerMTok": 5,
      "outputPerMTok": 15,
      "tokenization": "exact"
    },
    {
      "id": "anthropic:claude-3-5-sonnet",
      "provider": "Anthropic",
      "inputPerMTok": 3,
      "outputPerMTok": 15,
      "tokenization": "estimated"
    }
  ]
}

// src/costing.ts
export type ComputeMode = "visible-rows" | "primary-model";

export type PricingRow = {
  id: string;
  provider: string;
  inputPerMTok: number;
  outputPerMTok?: number;
  tokenization: "exact" | "estimated";
};

export type CostResult = {
  modelId: string;
  tokens: number;
  inputCostUSD: number;
  outputCostUSD: number;
  totalCostUSD: number;
  accuracy: "exact" | "estimated";
};

const roundUSD = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(10));
};

export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const computeCostUSD = (
  tokensIn: number,
  tokensOut: number,
  row: PricingRow,
): CostResult => {
  const safeTokensIn = Number.isFinite(tokensIn) ? Math.max(0, tokensIn) : 0;
  const safeTokensOut = Number.isFinite(tokensOut) ? Math.max(0, tokensOut) : 0;
  const inputCostUSD = roundUSD((safeTokensIn / 1_000_000) * row.inputPerMTok);
  const outputCostUSD = row.outputPerMTok
    ? roundUSD((safeTokensOut / 1_000_000) * row.outputPerMTok)
    : 0;

  return {
    modelId: row.id,
    tokens: safeTokensIn,
    inputCostUSD,
    outputCostUSD,
    totalCostUSD: roundUSD(inputCostUSD + outputCostUSD),
    accuracy: row.tokenization,
  };
};

export const selectRows = (rows: PricingRow[], mode: ComputeMode): PricingRow[] => {
  return mode === "primary-model" ? rows.slice(0, 1) : rows;
};
`;

const CODE_SAMPLE_PRESET = fitToLength(
  CODE_SAMPLE_PRESET_BASE,
  4275,
  "\n// note: preserve deterministic formatting and indentation for parser and syntax highlighter checks.",
);
// Length: 4275 chars.

const MIXED_UNICODE_PRESET_BASE = `# Unicode Stress Document

## Latin accents
Café résumé jalapeño fiancée coöperate naïve São Paulo déjà vu.

## Emoji and symbols
Launch report: 🚀✨🧪📈
Status icons: ✅ ⚠️ ❌
Math and currency: ∑ π √2 € ¥ ₹ ₿

## CJK sample
这是一个用于压力测试的段落，包含中文字符、标点符号，以及不同长度的句子。
日本語の文章も含めて、トークン化の差分が視覚的に確認できるようにします。
한국어 문장도 추가하여, 글자 수와 토큰 수가 어떻게 달라지는지 비교합니다.

## RTL sample
النص العربي يظهر هنا لاختبار اتجاه الكتابة من اليمين إلى اليسار مع علامات ترقيم.

## Combining marks and edge cases
Ame\u0301lie and cafe\u0301 may look similar but use different unicode sequences.
Zero-width test: word\u200Bbreak and byte\uFEFForder marker placeholders.
`;

const MIXED_UNICODE_PRESET = fitToLength(
  MIXED_UNICODE_PRESET_BASE,
  2684,
  "\nAdditional multilingual line for deterministic unicode coverage across scripts and punctuation.",
);
// Length: 2684 chars.

const PROMPT_BLOCK_PRESET_BASE = `SYSTEM ROLE
You are a reliability-focused product analyst preparing a release-readiness summary for a static cost calculator. Keep the response concise, grounded in provided inputs, and explicit about uncertainty.

OBJECTIVE
Produce a structured report that helps leadership decide whether the release is ready for general usage. Focus on operational risk, user impact, and practical next actions.

INPUT DATA
- Product type: browser-only, static frontend.
- Pricing source: bundled JSON with schema validation.
- Token policy: exact where tokenizer is available, estimated otherwise.
- Modes: visible rows mode (default), primary model mode (fast).
- Warning thresholds: 50,000 and 200,000 characters.

OUTPUT FORMAT
1) Summary
2) Risks
3) Recommendations
4) Open questions
5) Go/No-go recommendation

RESPONSE RULES
- Use markdown headings and short paragraphs.
- Use bullet lists for recommendations and open questions.
- Mention mode behavior and threshold behavior explicitly.
- Do not fabricate model pricing values.
- Do not reference external APIs or backends.
- If confidence is limited, state why.

QUALITY CHECKLIST
- Is the language neutral and actionable?
- Are exact and estimated accuracy labels explained?
- Are performance safeguards described with concrete thresholds?
- Are fallback behaviors described for clipboard or validation errors?
- Are recommendations scoped to static frontend changes only?

SCORING GUIDANCE
Score each category from 1 to 5:
- Reliability under normal input
- Reliability under large input
- UX clarity
- Error handling quality
- Documentation completeness

FINAL INSTRUCTION
End with a one-line decision statement that starts with "Decision:" and includes one blocker if applicable.
`;

const PROMPT_BLOCK_PRESET = fitToLength(
  PROMPT_BLOCK_PRESET_BASE,
  4620,
  "\n\nADDITIONAL DIRECTIVE\nWhen uncertain, ask for clarifying constraints and provide a conservative default recommendation with explicit assumptions.",
);
// Length: 4620 chars.

export const PRESETS: PresetDefinition[] = [
  {
    id: "short-note",
    label: "Short note (quick sanity check)",
    value: SHORT_PRESET,
    length: SHORT_PRESET.length,
    approxLabel: "~240 chars",
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
    approxLabel: "~4,300 chars",
  },
  {
    id: "mixed-unicode",
    label: "Mixed unicode stress test",
    value: MIXED_UNICODE_PRESET,
    length: MIXED_UNICODE_PRESET.length,
    approxLabel: "~2,700 chars",
  },
  {
    id: "prompt-block",
    label: "Prompt-like instruction block",
    value: PROMPT_BLOCK_PRESET,
    length: PROMPT_BLOCK_PRESET.length,
    approxLabel: "~4,600 chars",
  },
];
