export { normalizeText } from "./normalization/normalizeText";
export type { NormalizeOptions } from "./normalization/normalizeText";

export {
  countBytesUtf8,
  countCharacters,
  countGraphemes,
  countLines,
  countWords,
} from "./counters";

export { computeCostUSD } from "./pricing/cost";
export type { CostBreakdown } from "./pricing/cost";

export {
  clearOpenAITokenizerCache,
  countOpenAITokensExact,
  getOpenAITokenDetails,
} from "./tokenization/openaiTokenizer";
export type { OpenAITokenDetail } from "./tokenization/openaiTokenizer";

export {
  clearTokenCountCache,
  estimateTokens,
  getTokenCacheSize,
  getTokenCountForPricingRow,
} from "./tokenization/providerTokenizer";
export type {
  TokenCountMode,
  TokenCountResult,
} from "./tokenization/providerTokenizer";

export { hashText, stableTextKey } from "./cache/hash";
export { LruCache } from "./cache/lru";

export {
  PricingRowSchema,
  PricesFileSchema,
  validatePrices,
} from "./schema/prices";
export type {
  PricingValidationError,
  PricesFile,
} from "./schema/prices";
export type { PricingRow } from "./types/pricing";

export { formatUSD, sortModels } from "./utils";
export type { SortKey } from "./utils";
