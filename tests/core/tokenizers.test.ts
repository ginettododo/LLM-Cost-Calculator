import { describe, expect, it } from "vitest";

import prices from "../../src/data/prices.json";
import {
  estimatedTokenProvider,
  getAvailableProviders,
  getProviderExactness,
  getProviderForModel,
  listSupportedModels,
  openAiTokenProvider,
  toModelId,
} from "../../src/core";

describe("token provider registry", () => {
  it("returns OpenAI provider for OpenAI model ids", () => {
    const openAiModel = prices.models.find(
      (model) => model.provider === "OpenAI",
    );
    expect(openAiModel).toBeTruthy();
    const modelId = toModelId(openAiModel!.provider, openAiModel!.model);
    const provider = getProviderForModel(modelId);
    expect(provider.id).toBe(openAiTokenProvider.id);
    expect(getProviderExactness(modelId)).toBe("exact");
  });

  it("returns estimated provider for non-OpenAI model ids", () => {
    const nonOpenAiModel = prices.models.find(
      (model) => model.provider !== "OpenAI",
    );
    expect(nonOpenAiModel).toBeTruthy();
    const modelId = toModelId(nonOpenAiModel!.provider, nonOpenAiModel!.model);
    const provider = getProviderForModel(modelId);
    expect(provider.id).toBe(estimatedTokenProvider.id);
    expect(getProviderExactness(modelId)).toBe("estimated");
  });

  it("lists available providers with exactness", () => {
    const providers = getAvailableProviders();
    const providerIds = providers.map((provider) => provider.id);
    expect(providerIds).toContain(openAiTokenProvider.id);
    expect(providerIds).toContain(estimatedTokenProvider.id);
  });

  it("maps supported models to providers", () => {
    const supported = listSupportedModels();
    expect(supported.length).toBe(prices.models.length);
    const first = supported[0];
    expect(first?.modelId).toContain(":");
    expect(first?.providerId).toBeTruthy();
  });
});

describe("estimated token provider", () => {
  it("uses the char/4 heuristic", async () => {
    const result = await estimatedTokenProvider.countTokens("abcd", "any");
    expect(result.tokens).toBe(1);
    expect(result.exactness).toBe("estimated");
    expect(result.notes).toContain("char/4");
  });
});

describe("openai token provider snapshots", () => {
  it("matches known token counts for gpt-4o", async () => {
    const modelId = "openai:gpt-4o";
    const cases: Array<[string, number]> = [
      ["Hello world", 2],
      ["Hello, world!", 4],
      ["The quick brown fox jumps over the lazy dog.", 10],
      ["✅ tokens stay local", 4],
    ];

    for (const [text, expected] of cases) {
      const result = await openAiTokenProvider.countTokens(text, modelId);
      expect(result.tokens).toBe(expected);
      expect(result.exactness).toBe("exact");
    }
  });
});
