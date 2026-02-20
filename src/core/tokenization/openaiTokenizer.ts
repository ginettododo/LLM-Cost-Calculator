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
// optimized to avoid instantiating TextEncoder in a loop
const mapByteOffsetsToCharIndices = (text: string): Uint32Array => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const utf8Length = bytes.length;
  const byteToChar = new Uint32Array(utf8Length + 1);

  let charOffset = 0;
  let byteOffset = 0;

  while (byteOffset < utf8Length) {
    const b = bytes[byteOffset];

    // Fill the mapping for the start byte
    byteToChar[byteOffset] = charOffset;

    let seqLen = 1;
    let charLen = 1;

    if (b < 0x80) {
      // 1-byte sequence (ASCII)
      seqLen = 1;
      charLen = 1;
    } else if ((b & 0xe0) === 0xc0) {
      // 2-byte sequence
      seqLen = 2;
      charLen = 1;
    } else if ((b & 0xf0) === 0xe0) {
      // 3-byte sequence
      seqLen = 3;
      charLen = 1;
    } else if ((b & 0xf8) === 0xf0) {
      // 4-byte sequence (surrogate pair in JS)
      seqLen = 4;
      charLen = 2;
    }

    // Fill mapping for continuation bytes
    for (let i = 1; i < seqLen; i++) {
      if (byteOffset + i < utf8Length) {
        byteToChar[byteOffset + i] = charOffset;
      }
    }

    byteOffset += seqLen;
    charOffset += charLen;
  }

  // Final offset
  byteToChar[utf8Length] = charOffset;

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

// cl100k_base / o200k_base pre-tokenization regex (sourced from the encoder's patStr).
// Splitting on this first breaks text at natural word boundaries before BPE, preventing
// the O(n²) worst-case that js-tiktoken exhibits on long runs of identical characters.
// Small segments are batched together up to BATCH_CHARS to reduce WASM call overhead.
// Any single segment longer than HARD_CHUNK is further split to cap BPE complexity.
const CL100K_PRETOKENIZE_RE =
  /('s|'S|'t|'T|'re|'rE|'Re|'RE|'ve|'vE|'Ve|'VE|'m|'M|'ll|'lL|'Ll|'LL|'d|'D)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu;

const HARD_CHUNK = 10;   // max chars per BPE call for long/repetitive segments
const BATCH_CHARS = 2_000; // batch small segments up to this many chars per encode call

const countWithChunking = (text: string, encoder: ReturnType<typeof getEncoding>): number => {
  const segs = text.match(CL100K_PRETOKENIZE_RE) ?? [];

  // If regex matched nothing (unusual input), fall back to hard-chunk the whole string
  if (segs.length === 0) {
    let total = 0;
    for (let i = 0; i < text.length; i += HARD_CHUNK) {
      total += encoder.encode(text.slice(i, i + HARD_CHUNK)).length;
    }
    return total;
  }

  let total = 0;
  let batch = "";
  for (const seg of segs) {
    if (seg.length > HARD_CHUNK) {
      // Flush accumulated batch first
      if (batch.length > 0) {
        total += encoder.encode(batch).length;
        batch = "";
      }
      // Hard-chunk this oversized segment
      for (let i = 0; i < seg.length; i += HARD_CHUNK) {
        total += encoder.encode(seg.slice(i, i + HARD_CHUNK)).length;
      }
    } else if (batch.length + seg.length > BATCH_CHARS) {
      total += encoder.encode(batch).length;
      batch = seg;
    } else {
      batch += seg;
    }
  }
  if (batch.length > 0) {
    total += encoder.encode(batch).length;
  }
  return total;
};

export const countOpenAITokensExact = (text: string, model: string): number => {
  if (text.length === 0) {
    return 0;
  }

  const encoder = getEncoderForModel(model);

  if (text.length <= BATCH_CHARS) {
    return encoder.encode(text).length;
  }

  return countWithChunking(text, encoder);
};

export const clearOpenAITokenizerCache = (): void => {
  encoderCache.clear();
  if (worker) {
    worker.postMessage({ type: "clearCache" });
  }
};

// --- Web Worker Client ---

let worker: Worker | null = null;
const pending
  = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

const getWorker = () => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!worker) {
    worker = new Worker(new URL("./tokenizer.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e) => {
      const { id, error, count, details } = e.data;
      const p = pending.get(id);
      if (p) {
        if (error) p.reject(new Error(error));
        else if (count !== undefined) p.resolve(count);
        else if (details !== undefined) p.resolve(details);
        pending.delete(id);
      }
    };
  }
  return worker;
};

export const countOpenAITokensAsync = (text: string, model: string): Promise<number> => {
  const w = getWorker();
  if (!w) return Promise.resolve(countOpenAITokensExact(text, model));

  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "count", text, model, id });
  });
};

export const getOpenAITokenDetailsAsync = (text: string, model: string): Promise<OpenAITokenDetail[]> => {
  const w = getWorker();
  if (!w) return Promise.resolve(getOpenAITokenDetails(text, model));

  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "details", text, model, id });
  });
};
