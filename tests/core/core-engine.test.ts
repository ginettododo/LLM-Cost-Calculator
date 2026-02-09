import { describe, expect, it } from "vitest";

import {
  countBytesUtf8,
  computeCostUSD,
  formatUSD,
  normalizeText,
  validatePrices,
} from "../../src/core";

describe("normalizeText", () => {
  it("normalizes newline variants and collapses spaces/tabs", () => {
    const input = "\r\nHello\rworld\t\tfrom\t\tcalculator\n";
    const normalized = normalizeText(input);

    expect(normalized).toBe("Hello\nworld from calculator");
  });

  it("retains invisible characters when removeInvisible is false", () => {
    const input = "a\u200Bb";
    expect(normalizeText(input, { removeInvisible: false })).toBe("a\u200Bb");
  });

  it("removes invisible characters when enabled", () => {
    const input = "a\u200Bb\uFEFFc";
    expect(normalizeText(input, { removeInvisible: true })).toBe("abc");
  });
});

describe("countBytesUtf8", () => {
  it("counts UTF-8 bytes correctly for ASCII, unicode, and emoji", () => {
    const cases: Array<[string, number]> = [
      ["", 0],
      ["hello", 5],
      ["café", 5],
      ["€", 3],
      ["🙂", 4],
      ["👩‍🚀", 11],
      ["𠜎", 4],
    ];

    cases.forEach(([input, expected]) => {
      expect(countBytesUtf8(input)).toBe(expected);
    });
  });
});

describe("computeCostUSD", () => {
  it("rounds to a stable precision and computes totals", () => {
    const result = computeCostUSD(333_333, 444_444, {
      provider: "Test",
      model: "alpha",
      model_id: "test:alpha",
      modality: "text",
      input_per_mtok: 0.29,
      output_per_mtok: 0.59,
      currency: "USD",
      source_url: "https://example.com",
      retrieved_at: "2024-01-01",
      pricing_confidence: "high",
    });

    const rawInput = (333_333 / 1_000_000) * 0.29;
    const rawOutput = (444_444 / 1_000_000) * 0.59;

    expect(result.inputCostUSD).toBe(Number(rawInput.toFixed(10)));
    expect(result.outputCostUSD).toBe(Number(rawOutput.toFixed(10)));
    expect(result.totalUSD).toBe(
      Number((result.inputCostUSD + result.outputCostUSD).toFixed(10)),
    );
  });

  it("handles missing output pricing", () => {
    const result = computeCostUSD(500_000, 250_000, {
      provider: "Test",
      model: "alpha",
      model_id: "test:alpha",
      modality: "text",
      input_per_mtok: 4,
      currency: "USD",
      source_url: "https://example.com",
      retrieved_at: "2024-01-01",
      pricing_confidence: "high",
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
        model_id: "openai:gpt-test",
        modality: "text",
        input_per_mtok: 1.5,
        output_per_mtok: 2.5,
        currency: "USD",
        source_url: "https://example.com",
        retrieved_at: "2024-01-01",
        pricing_confidence: "high",
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

describe("formatUSD", () => {
  it("handles non-finite values gracefully", () => {
    expect(formatUSD(Number.NaN)).toBe("—");
    expect(formatUSD(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
