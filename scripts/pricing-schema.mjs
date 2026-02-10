import { z } from "zod";

export const PricingRowSchema = z
  .object({
    provider: z.string().min(1),
    model: z.string().min(1),
    model_id: z.string().min(1).optional(),
    release_date: z.string().min(1).optional(),
    modality: z.enum(["text", "audio", "realtime", "multimodal"]).optional(),
    input_per_mtok: z.number().nonnegative(),
    output_per_mtok: z.number().nonnegative().optional(),
    cached_input_per_mtok: z.number().nonnegative().optional(),
    currency: z.string().min(1),
    source_url: z.string().url(),
    retrieved_at: z.string().min(1),
    pricing_confidence: z.string().min(1).optional(),
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
    models: z.array(PricingRowSchema).min(1),
  })
  .strict();

export const parsePricesFile = (data) => {
  const parsed = PricesFileSchema.safeParse(data);

  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
    );

    throw new Error(["Invalid prices.json schema:", ...issues].join("\n"));
  }

  return parsed.data;
};
