import { afterEach, describe, expect, it } from "vitest";

import {
  LruCache,
  clearOpenAITokenizerCache,
  clearTokenCountCache,
  countOpenAITokensExact,
  getOpenAITokenDetails,
  getTokenCacheSize,
  getTokenCountForPricingRow,
  hashText,
  stableTextKey,
} from "../../src/core";

afterEach(() => {
  clearTokenCountCache();
  clearOpenAITokenizerCache();
});

describe("hashText/stableTextKey", () => {
  it("is stable for the same input", () => {
    const input = "consistent string";
    expect(hashText(input)).toBe(hashText(input));
    expect(stableTextKey(input)).toBe(stableTextKey(input));
  });

  it("changes when text changes", () => {
    expect(hashText("abc")).not.toBe(hashText("abd"));
  });
});

describe("LruCache", () => {
  it("evicts least-recently-used entries", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });
});

describe("OpenAI exact token snapshots", () => {
  it("matches snapshots for representative strings", () => {
    const model = "gpt-4o";
    const samples = {
      ascii: "The quick brown fox jumps over 13 lazy dogs.",
      punctuation: "email@example.com #pricing $12.34 (v1.0)",
      japanese: "こんにちは世界。トークン数を確認します。",
      emoji: "Launch sequence: 🚀✨🙂",
      mixed: "naïve café — مرحبا — 你好 — 👩‍🚀",
    };

    const counts = Object.fromEntries(
      Object.entries(samples).map(([key, value]) => [
        key,
        countOpenAITokensExact(value, model),
      ]),
    );

    expect(counts).toMatchInlineSnapshot(
      {
        ascii: expect.any(Number),
        punctuation: expect.any(Number),
        japanese: expect.any(Number),
        emoji: expect.any(Number),
        mixed: expect.any(Number),
      },
      `
      {
        "ascii": Any<Number>,
        "emoji": Any<Number>,
        "japanese": Any<Number>,
        "mixed": Any<Number>,
        "punctuation": Any<Number>,
      }
    `,
    );

    Object.values(counts).forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });
});

describe("getTokenCountForPricingRow", () => {
  it("uses exact counting for OpenAI and caches results", () => {
    const row = { provider: "OpenAI", model: "gpt-4o", model_id: "openai:gpt-4o" };
    const text = "Caching should reuse token counts.";

    const first = getTokenCountForPricingRow(text, row);
    const second = getTokenCountForPricingRow(text, row);

    expect(first.mode).toBe("exact");
    expect(second.mode).toBe("exact");
    expect(second.tokens).toBe(first.tokens);
    expect(getTokenCacheSize()).toBe(1);
  });

  it("uses estimated counting for non-OpenAI providers", () => {
    const row = {
      provider: "Anthropic",
      model: "claude-3.5-sonnet",
      model_id: "anthropic:claude-3.5-sonnet",
    };
    const text = "12345678";

    const result = getTokenCountForPricingRow(text, row);
    expect(result.mode).toBe("estimated");
    expect(result.tokens).toBe(2);
  });

  it("separates cache entries by model_id", () => {
    const text = "Cache key should include model id.";
    const base = { provider: "OpenAI", model: "gpt-4o" } as const;
    const rowA = { ...base, model_id: "openai:gpt-4o-a" };
    const rowB = { ...base, model_id: "openai:gpt-4o-b" };

    getTokenCountForPricingRow(text, rowA);
    getTokenCountForPricingRow(text, rowB);

    expect(getTokenCacheSize()).toBe(2);
  });
});


describe("OpenAI exact tokenizer vectors", () => {
  it("matches known cl100k_base token ids for stable sample text", () => {
    const text = "OpenAI tokenizer test: tokens, bytes, and ranges.";
    const expectedTokenIds = [6447, 17527, 99665, 1746, 25, 20290, 11, 11643, 11, 326, 33269, 13];

    const details = getOpenAITokenDetails(text, "openai:gpt-4o");

    expect(details.map((token) => token.tokenId)).toEqual(expectedTokenIds);
    expect(countOpenAITokensExact(text, "openai:gpt-4o")).toBe(expectedTokenIds.length);

    const fallbackVector = getOpenAITokenDetails("Hello world", "openai:non-existent-model");
    expect(fallbackVector.map((token) => token.tokenId)).toEqual([9906, 1917]);
  });

  it("returns contiguous byte ranges that reconstruct utf-8 length", () => {
    const text = "naïve café — مرحبا — 你好 — 👩‍🚀";
    const details = getOpenAITokenDetails(text, "gpt-4o");

    const utf8Length = new TextEncoder().encode(text).length;
    expect(details[0]?.byteStart ?? 0).toBe(0);

    details.forEach((token, index) => {
      if (index === 0) {
        return;
      }
      expect(token.byteStart).toBe(details[index - 1]?.byteEnd);
      expect(token.charStart).toBe(details[index - 1]?.charEnd);
    });

    const finalEnd = details[details.length - 1]?.byteEnd ?? 0;
    expect(finalEnd).toBe(utf8Length);
    expect(details[0]?.charStart ?? 0).toBe(0);
    expect(details[details.length - 1]?.charEnd ?? 0).toBe(text.length);
  });

  it("keeps exact counting stable for a long 500+ word paragraph", () => {
    const longParagraph = Array.from({ length: 620 }, (_, index) => `word-${index % 37}`)
      .join(" ")
      .trim();

    const details = getOpenAITokenDetails(longParagraph, "openai:gpt-4o-mini");
    const count = countOpenAITokensExact(longParagraph, "openai:gpt-4o-mini");

    expect(longParagraph.split(/\s+/).length).toBeGreaterThan(500);
    expect(count).toBe(details.length);
    expect(count).toBeGreaterThan(500);
  });
});
