import { parseModelId } from "../modelId";
import type { TokenProvider } from "../types";

type Encoding = {
  encode: (text: string) => number[];
};

const OPENAI_PROVIDER_ID = "openai";

const encodingCache = new Map<string, Promise<Encoding>>();

const resolveEncodingName = (modelName: string) => {
  if (modelName.startsWith("gpt-4o")) {
    return "o200k_base";
  }
  if (
    modelName.startsWith("gpt-4") ||
    modelName.startsWith("gpt-3.5") ||
    modelName.startsWith("text-embedding-3")
  ) {
    return "cl100k_base";
  }
  return "cl100k_base";
};

const getEncodingForModel = async (modelName: string) => {
  const cacheKey = `model:${modelName}`;
  const cached = encodingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const encodingPromise = (async () => {
    const { encodingForModel, getEncoding } = await import("js-tiktoken");
    try {
      return encodingForModel(modelName) as Encoding;
    } catch {
      return getEncoding(resolveEncodingName(modelName)) as Encoding;
    }
  })();

  encodingCache.set(cacheKey, encodingPromise);
  return encodingPromise;
};

export const openAiTokenProvider: TokenProvider = {
  id: OPENAI_PROVIDER_ID,
  label: "OpenAI (tiktoken)",
  supportsModel: (modelId: string) =>
    parseModelId(modelId).providerId === OPENAI_PROVIDER_ID,
  countTokens: async (text: string, modelId: string) => {
    if (!text) {
      return { tokens: 0, exactness: "exact" };
    }
    const { model } = parseModelId(modelId);
    const encoding = await getEncodingForModel(model);
    return {
      tokens: encoding.encode(text).length,
      exactness: "exact",
    };
  },
};
