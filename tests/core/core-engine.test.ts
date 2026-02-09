import { describe, expect, it } from "vitest";

import {
  countBytesUtf8,
  countCharacters,
  countGraphemes,
  countLines,
  countWords,
  computeCostUSD,
  normalizeText,
  validatePrices,
} from "../../src/core";

describe("normalizeText", () => {
  it("normalizes newlines, collapses spaces, trims, and removes invisibles", () => {
    const input = "  Hello\r\nworld\t\t!\u200B  ";
    const normalized = normalizeText(input, { removeInvisible: true });
    expect(normalized).toBe("Hello\nworld !");
  });
});

describe("counters", () => {
  it("counts characters and graphemes with emoji and accents", () => {
    const text = "a💙 café";
    expect(countCharacters(text)).toBe(8);
    const expectedGraphemes =
      typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined"
        ? 7
        : Array.from(text).length;
    expect(countGraphemes(text)).toBe(expectedGraphemes);
  });

  it("counts words, lines, and bytes", () => {
    const text = "café 👩‍🚀\nnext line";
    expect(countWords(text)).toBe(3);
    expect(countLines(text)).toBe(2);
    expect(countBytesUtf8("€")).toBe(3);
  });
});

describe("computeCostUSD", () => {
  it("computes total cost and handles missing output pricing", () => {
    const result = computeCostUSD(500_000, 250_000, {
      provider: "Test",
      model: "alpha",
      input_per_mtok: 4,
      currency: "USD",
      source_url: "https://example.com",
      retrieved_at: "2024-01-01",
    });

    expect(result.inputCostUSD).toBeCloseTo(2);
    expect(result.outputCostUSD).toBe(0);
    expect(result.totalUSD).toBeCloseTo(2);
  });
});

describe("validatePrices", () => {
  it("returns typed rows for valid data", () => {
    const rows = validatePrices([
      {
        provider: "OpenAI",
        model: "gpt-test",
        input_per_mtok: 1.5,
        output_per_mtok: 2.5,
        currency: "USD",
        source_url: "https://example.com",
        retrieved_at: "2024-01-01",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.model).toBe("gpt-test");
  });

  it("throws a friendly error on invalid data", () => {
    expect(() => validatePrices([{ model: "missing-provider" }])).toThrowError(
      /Invalid pricing data/,
    );
  });
});
