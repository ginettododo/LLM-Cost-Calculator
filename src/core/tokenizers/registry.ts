import prices from "../../data/prices.json";
import { toModelId } from "./modelId";
import { estimatedTokenProvider } from "./providers/estimatedProvider";
import { openAiTokenProvider } from "./providers/openaiProvider";
import type { Exactness, ProviderMeta, SupportedModel, TokenProvider } from "./types";

const PROVIDERS: TokenProvider[] = [openAiTokenProvider, estimatedTokenProvider];

export const getAvailableProviders = (): ProviderMeta[] =>
  PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    exactness: provider.id === openAiTokenProvider.id ? "exact" : "estimated",
  }));

export const getProviderForModel = (modelId: string): TokenProvider =>
  PROVIDERS.find((provider) => provider.supportsModel(modelId)) ??
  estimatedTokenProvider;

export const getProviderExactness = (modelId: string): Exactness =>
  getProviderForModel(modelId).id === openAiTokenProvider.id
    ? "exact"
    : "estimated";

export const listSupportedModels = (): SupportedModel[] =>
  prices.models.map((row) => {
    const modelId = toModelId(row.provider, row.model);
    const provider = getProviderForModel(modelId);
    return {
      modelId,
      providerId: provider.id,
      providerLabel: provider.label,
      exactness: getProviderExactness(modelId),
    };
  });
