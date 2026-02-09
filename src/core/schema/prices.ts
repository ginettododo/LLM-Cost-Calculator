import { z } from "zod";
import type { PricingRow } from "../types/pricing";

export const PricingRowSchema: z.ZodType<PricingRow> = z
  .object({
    provider: z.string().min(1),
    model: z.string().min(1),
    model_id: z.string().min(1),
    release_date: z.string().min(1).optional(),
    modality: z.enum(["text", "audio", "realtime", "multimodal"]),
    input_per_mtok: z.number().nonnegative(),
    output_per_mtok: z.number().nonnegative().optional(),
    cached_input_per_mtok: z.number().nonnegative().optional(),
    currency: z.string().min(1),
    source_url: z.string().url(),
    retrieved_at: z.string().min(1),
    pricing_confidence: z.enum(["high", "medium", "low"]),
    pricing_tier: z.string().min(1).optional(),
    is_tiered: z.boolean().optional(),
    tokenization: z.enum(["exact", "estimated"]).optional(),
    notes: z.string().min(1).optional(),
  })
  .strict();

export const PricesFileSchema = z
  .object({
    currency: z.string().min(1),
    retrieved_at: z.string().min(1),
    source_url: z.string().url(),
    models: z.array(PricingRowSchema),
  })
  .strict();

const PricesSchema = z.union([z.array(PricingRowSchema), PricesFileSchema]);

export type PricesFile = z.infer<typeof PricesFileSchema>;

export type PricingValidationError = {
  message: string;
  issues: Array<{ path: string; message: string }>;
};

export const validatePrices = (data: unknown): PricingRow[] => {
  const parsed = PricesSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const error: PricingValidationError = {
      message: "Invalid pricing data.",
      issues,
    };
    throw error;
  }

  return Array.isArray(parsed.data) ? parsed.data : parsed.data.models;
};
