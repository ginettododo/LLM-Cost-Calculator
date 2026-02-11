import { encodingForModel, getEncoding } from "js-tiktoken";

const DEFAULT_OPENAI_ENCODING = "cl100k_base";
const encoderCache = new Map<string, ReturnType<typeof getEncoding>>();


export type OpenAITokenDetail = {
  index: number;
  tokenId: number;
  text: string;
  byteStart: number;
  byteEnd: number;
  charStart: number;
  charEnd: number;
};





// Helper to map byte offsets to character indices for accurate highlighting
const mapByteOffsetsToCharIndices = (text: string): Uint32Array => {
  const utf8Length = new TextEncoder().encode(text).length;
  const byteToChar = new Uint32Array(utf8Length + 1);

  let byteOffset = 0;
  let charOffset = 0;
  byteToChar[0] = 0;

  for (const symbol of text) {
    const symbolBytes = new TextEncoder().encode(symbol).length;

    for (let index = 0; index < symbolBytes; index += 1) {
      byteToChar[byteOffset + index] = charOffset;
    }

    byteOffset += symbolBytes;
    charOffset += symbol.length;
    byteToChar[byteOffset] = charOffset;
  }

  return byteToChar;
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
  const byteToCharOffset = mapByteOffsetsToCharIndices(text);
  let byteCursor = 0;

  return tokenIds.map((tokenId, index) => {
    // Access internal textMap for exact byte sequences since public decode() is lossy for split-char tokens
    const internalEncoder = encoder as unknown as { textMap?: Map<number, Uint8Array> };
    const tokenBytes = internalEncoder.textMap?.get(tokenId) ?? new Uint8Array();

    // Fallback if textMap is missing (e.g. library update)
    if (tokenBytes.length === 0) {
      // If we can't get exact bytes, we might have issues with highlighting.
      // But preventing crash is priority.
    }

    const tokenText = new TextDecoder().decode(tokenBytes);
    const byteLength = tokenBytes.length;

    const detail: OpenAITokenDetail = {
      index,
      tokenId,
      text: tokenText,
      byteStart: byteCursor,
      byteEnd: byteCursor + byteLength,
      charStart: byteToCharOffset[byteCursor] ?? 0,
      charEnd: byteToCharOffset[byteCursor + byteLength] ?? text.length,
    };
    byteCursor += byteLength;
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
