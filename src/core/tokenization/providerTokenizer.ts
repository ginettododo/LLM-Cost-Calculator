import type { PricingRow } from "../types/pricing";
import { LruCache } from "../cache/lru";
import { stableTextKey } from "../cache/hash";
import { countOpenAITokensExact } from "./openaiTokenizer";

export type TokenCountMode = "exact" | "estimated";

export type TokenCountResult = {
  tokens: number;
  mode: TokenCountMode;
};

const TOKEN_CACHE_MAX_ENTRIES = 50;
const tokenCountCache = new LruCache<string, TokenCountResult>(TOKEN_CACHE_MAX_ENTRIES);

// Unicode ranges for smarter token estimation
const CJK_REGEX = /[\u3000-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}]/gu;
const WHITESPACE_REGEX = /\s+/g;

/**
 * Improved token estimation heuristic.
 * - CJK characters ≈ 1.5 tokens per character (they usually encode as 2–3 tokens
 *   in BPE but are single chars, so 1.5 is a good middle ground)
 * - Regular text ≈ chars/4 (standard BPE approximation for Latin scripts)
 * - Adjusts for whitespace density:
 *   more whitespace → fewer tokens (whitespace merges in BPE)
 */
export const estimateTokens = (text: string): number => {
  if (text.length === 0) {
    return 0;
  }

  // Count CJK characters
  const cjkMatches = text.match(CJK_REGEX);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Count whitespace characters
  const wsMatches = text.match(WHITESPACE_REGEX);
  const wsCharCount = wsMatches ? wsMatches.reduce((sum, m) => sum + m.length, 0) : 0;

  // Non-CJK, non-whitespace character count
  const regularCount = text.length - cjkCount - wsCharCount;

  // CJK: ~1.5 tokens per char
  const cjkTokens = cjkCount * 1.5;

  // Regular text: ~1 token per 4 chars (standard BPE heuristic)
  const regularTokens = regularCount / 4;

  // Whitespace: merged by BPE, roughly 1 token per 3-4 whitespace chars
  const wsTokens = wsCharCount / 3.5;

  return Math.max(1, Math.ceil(cjkTokens + regularTokens + wsTokens));
};

const buildTokenCacheKey = (
  text: string,
  pricingRow: Pick<PricingRow, "provider" | "model" | "model_id">,
) => {
  const provider = pricingRow.provider.trim().toLowerCase();
  const modelKey = pricingRow.model_id?.trim() || pricingRow.model;
  return `${provider}|${modelKey}|${stableTextKey(text)}`;
};

const isOpenAIProvider = (provider: string): boolean =>
  provider.trim().toLowerCase() === "openai";

export const getTokenCountForPricingRow = (
  text: string,
  pricingRow: Pick<PricingRow, "provider" | "model" | "model_id">,
): TokenCountResult => {
  const cacheKey = buildTokenCacheKey(text, pricingRow);
  const cached = tokenCountCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let result: TokenCountResult;
  if (isOpenAIProvider(pricingRow.provider)) {
    try {
      result = {
        tokens: countOpenAITokensExact(text, pricingRow.model),
        mode: "exact",
      };
    } catch {
      result = {
        tokens: estimateTokens(text),
        mode: "estimated",
      };
    }
  } else {
    result = {
      tokens: estimateTokens(text),
      mode: "estimated",
    };
  }

  tokenCountCache.set(cacheKey, result);
  return result;
};

export const clearTokenCountCache = (): void => {
  tokenCountCache.clear();
};

export const getTokenCacheSize = (): number => tokenCountCache.size();
