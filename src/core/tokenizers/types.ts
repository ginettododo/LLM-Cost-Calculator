export type Exactness = "exact" | "estimated";

export type TokenCountResult = {
  tokens: number;
  exactness: Exactness;
  notes?: string;
};

export type ProviderMeta = {
  id: string;
  label: string;
  exactness: Exactness;
};

export type SupportedModel = {
  modelId: string;
  providerId: string;
  providerLabel: string;
  exactness: Exactness;
};

export interface TokenProvider {
  id: string;
  label: string;
  supportsModel: (modelId: string) => boolean;
  countTokens: (text: string, modelId: string) => Promise<TokenCountResult>;
}
