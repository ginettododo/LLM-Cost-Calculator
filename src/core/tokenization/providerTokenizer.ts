import type { PricingRow } from "../types/pricing";
import { LruCache } from "../cache/lru";
import { stableTextKey } from "../cache/hash";
import { countOpenAITokensExact } from "./openaiTokenizer";

export type TokenCountMode = "exact" | "estimated";

export type TokenCountResult = {
  tokens: number;
  mode: TokenCountMode;
};

const TOKEN_CACHE_MAX_ENTRIES = 250;
const tokenCountCache = new LruCache<string, TokenCountResult>(TOKEN_CACHE_MAX_ENTRIES);

export const estimateTokens = (text: string): number => {
  if (text.length === 0) {
    return 0;
  }

  return Math.ceil(text.length / 4);
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
    result = {
      tokens: countOpenAITokensExact(text, pricingRow.model_id ?? pricingRow.model),
      mode: "exact",
    };
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
