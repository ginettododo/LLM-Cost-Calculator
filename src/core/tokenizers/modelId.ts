export const normalizeProviderId = (provider: string) =>
  provider.trim().toLowerCase().replace(/\s+/g, "-");

export const toModelId = (provider: string, model: string) =>
  `${normalizeProviderId(provider)}:${model}`;

export const parseModelId = (modelId: string) => {
  const [providerId, ...rest] = modelId.split(":");
  return {
    providerId: providerId ?? "",
    model: rest.join(":"),
  };
};
