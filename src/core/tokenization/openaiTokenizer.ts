import { encodingForModel, getEncoding } from "js-tiktoken";

const DEFAULT_OPENAI_ENCODING = "cl100k_base";
const encoderCache = new Map<string, ReturnType<typeof getEncoding>>();
const utf8Decoder = new TextDecoder("utf-8", { fatal: false });

export type OpenAITokenDetail = {
  index: number;
  tokenId: number;
  text: string;
  byteStart: number;
  byteEnd: number;
};

const normalizeModelName = (model: string): string => {
  const trimmed = model.trim();
  if (!trimmed) {
    return "";
  }

  const providerPrefix = "openai:";
  if (trimmed.toLowerCase().startsWith(providerPrefix)) {
    return trimmed.slice(providerPrefix.length);
  }

  return trimmed;
};

const getEncoderForModel = (model: string): ReturnType<typeof getEncoding> => {
  const modelName = normalizeModelName(model);
  const cacheKey = modelName || DEFAULT_OPENAI_ENCODING;
  const cached = encoderCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let encoder: ReturnType<typeof getEncoding>;
  try {
    encoder = modelName
      ? encodingForModel(modelName as Parameters<typeof encodingForModel>[0])
      : getEncoding(DEFAULT_OPENAI_ENCODING);
  } catch {
    encoder = getEncoding(DEFAULT_OPENAI_ENCODING);
  }

  encoderCache.set(cacheKey, encoder);
  return encoder;
};

export const getOpenAITokenDetails = (
  text: string,
  model: string,
): OpenAITokenDetail[] => {
  if (text.length === 0) {
    return [];
  }

  const encoder = getEncoderForModel(model);
  const tokenIds = encoder.encode(text);
  let byteCursor = 0;

  return tokenIds.map((tokenId, index) => {
    const tokenBytes =
      (encoder as unknown as { textMap?: Map<number, Uint8Array> }).textMap?.get(tokenId) ??
      new Uint8Array();
    const tokenText = utf8Decoder.decode(tokenBytes);
    const detail: OpenAITokenDetail = {
      index,
      tokenId,
      text: tokenText,
      byteStart: byteCursor,
      byteEnd: byteCursor + tokenBytes.length,
    };
    byteCursor += tokenBytes.length;
    return detail;
  });
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
