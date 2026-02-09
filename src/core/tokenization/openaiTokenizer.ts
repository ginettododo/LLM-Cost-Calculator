import { encodingForModel, getEncoding } from "js-tiktoken";

const DEFAULT_OPENAI_ENCODING = "o200k_base";
const encoderCache = new Map<string, ReturnType<typeof getEncoding>>();

const getEncoderForModel = (model: string): ReturnType<typeof getEncoding> => {
  const cached = encoderCache.get(model);
  if (cached) {
    return cached;
  }

  let encoder: ReturnType<typeof getEncoding>;
  try {
    encoder = encodingForModel(model as Parameters<typeof encodingForModel>[0]);
  } catch {
    encoder = getEncoding(DEFAULT_OPENAI_ENCODING);
  }

  encoderCache.set(model, encoder);
  return encoder;
};

export const countOpenAITokensExact = (text: string, model: string): number => {
  if (text.length === 0) {
    return 0;
  }

  return getEncoderForModel(model).encode(text).length;
};

export const clearOpenAITokenizerCache = (): void => {
  encoderCache.clear();
};
