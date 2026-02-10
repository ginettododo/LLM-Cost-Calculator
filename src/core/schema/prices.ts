import { z } from "zod";
import type { PricingRow } from "../types/pricing";

const PricingEntrySchema = z
  .object({
    kind: z.enum(["input", "output"]),
    price_per_million: z.number().nonnegative(),
    currency: z.string().min(1),
  })
  .strict();

export const PricingRowSchema = z
  .object({
    provider: z.string().min(1),
    model_id: z.string().min(1),
    display_name: z.string().min(1),
    category: z.enum(["flagship", "mainstream", "budget", "legacy"]),
    pricing: z.array(PricingEntrySchema).min(1),
    release_date: z.string().min(1).optional(),
    pricing_confidence: z.enum(["high", "medium", "low"]),
    source_url: z.string().url(),
    notes: z.string().min(1).optional(),
  })
  .strict();

const LegacyPricingRowSchema = z
  .object({
    provider: z.string().min(1),
    model: z.string().min(1),
    model_id: z.string().min(1),
    release_date: z.string().min(1).optional(),
    modality: z.enum(["text", "audio", "realtime", "multimodal"]).optional(),
    input_per_mtok: z.number().nonnegative(),
    output_per_mtok: z.number().nonnegative().optional(),
    currency: z.string().min(1),
    source_url: z.string().url(),
    retrieved_at: z.string().min(1),
    pricing_confidence: z.enum(["high", "medium", "low"]),
    notes: z.string().min(1).optional(),
  })
  .strict();

export const PricesFileSchema = z
  .object({
    currency: z.string().min(1),
    retrieved_at: z.string().min(1),
    source_url: z.string().url(),
    featuredModels: z.array(z.string().min(1)).default([]),
    models: z.array(PricingRowSchema),
  })
  .strict();

const PricesSchema = z.union([PricesFileSchema, z.array(LegacyPricingRowSchema)]);

export type PricesFile = z.infer<typeof PricesFileSchema>;

export type PricingValidationError = {
  message: string;
  issues: Array<{ path: string; message: string }>;
};

const toPricingRow = (
  raw: z.infer<typeof PricingRowSchema>,
  defaults: Pick<PricesFile, "retrieved_at" | "currency">,
): PricingRow => {
  const inputPricing = raw.pricing.find((entry) => entry.kind === "input");
  const outputPricing = raw.pricing.find((entry) => entry.kind === "output");

  if (!inputPricing) {
    throw new Error(`Model ${raw.model_id} is missing an input pricing entry.`);
  }

  return {
    provider: raw.provider,
    model: raw.display_name,
    model_id: raw.model_id,
    display_name: raw.display_name,
    category: raw.category,
    pricing: raw.pricing,
    release_date: raw.release_date,
    modality: "text",
    input_per_mtok: inputPricing.price_per_million,
    output_per_mtok: outputPricing?.price_per_million,
    currency: inputPricing.currency || defaults.currency,
    source_url: raw.source_url,
    retrieved_at: defaults.retrieved_at,
    pricing_confidence: raw.pricing_confidence,
    tokenization: raw.provider.toLowerCase() === "openai" ? "exact" : "estimated",
    notes: raw.notes,
  };
};

export const validatePrices = (data: unknown): PricingRow[] => {
  const parsed = PricesSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw {
      message: "Invalid pricing data.",
      issues,
    } satisfies PricingValidationError;
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map((item) => ({ ...item, modality: item.modality ?? "text" }));
  }

  const fileData = parsed.data as PricesFile;
  return fileData.models.map((row) => toPricingRow(row, fileData));
};
