import { afterEach, describe, expect, it } from "vitest";

import {
  LruCache,
  clearOpenAITokenizerCache,
  clearTokenCountCache,
  countOpenAITokensExact,
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

    expect(counts).toMatchInlineSnapshot(`
      {
        "ascii": 11,
        "emoji": 8,
        "japanese": 14,
        "mixed": 19,
        "punctuation": 13,
      }
    `);
  });
});

describe("getTokenCountForPricingRow", () => {
  it("uses exact counting for OpenAI and caches results", () => {
    const row = { provider: "OpenAI", model: "gpt-4o" };
    const text = "Caching should reuse token counts.";

    const first = getTokenCountForPricingRow(text, row);
    const second = getTokenCountForPricingRow(text, row);

    expect(first.mode).toBe("exact");
    expect(second.mode).toBe("exact");
    expect(second.tokens).toBe(first.tokens);
    expect(getTokenCacheSize()).toBe(1);
  });

  it("uses estimated counting for non-OpenAI providers", () => {
    const row = { provider: "Anthropic", model: "claude-3.5-sonnet" };
    const text = "12345678";

    const result = getTokenCountForPricingRow(text, row);
    expect(result.mode).toBe("estimated");
    expect(result.tokens).toBe(2);
  });
});
