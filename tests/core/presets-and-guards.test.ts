import { describe, expect, it } from "vitest";

import { computeCostUSD } from "../../src/core";
import { PRESETS } from "../../src/ui/data/presets";

describe("preset definitions", () => {
  it("keeps exactly one short preset and all others long-form", () => {
    const shortPresets = PRESETS.filter((preset) => preset.length <= 500);
    expect(shortPresets).toHaveLength(1);

    const longPresets = PRESETS.filter((preset) => preset.length > 500);
    expect(longPresets).toHaveLength(PRESETS.length - 1);
  });

  it("preserves expected deterministic lengths", () => {
    const expectedLengths: Record<string, number> = {
      "short-note": 241,
      "long-article": 5003,
      "very-long-article": 10012,
      "code-sample": 4275,
      "mixed-unicode": 2684,
      "prompt-block": 4620,
    };

    PRESETS.forEach((preset) => {
      expect(preset.length).toBe(expectedLengths[preset.id]);
      expect(preset.value.length).toBe(expectedLengths[preset.id]);
    });
  });
});

describe("computeCostUSD guards", () => {
  it("sanitizes invalid token counts to avoid NaN costs", () => {
    const result = computeCostUSD(Number.NaN, Number.POSITIVE_INFINITY, {
      provider: "Test",
      model: "guarded",
      model_id: "test:guarded",
      modality: "text",
      input_per_mtok: 2,
      output_per_mtok: 4,
      currency: "USD",
      source_url: "https://example.com",
      retrieved_at: "2024-01-01",
      pricing_confidence: "high",
    });

    expect(result.inputCostUSD).toBe(0);
    expect(result.outputCostUSD).toBe(0);
    expect(result.totalUSD).toBe(0);
  });
});
