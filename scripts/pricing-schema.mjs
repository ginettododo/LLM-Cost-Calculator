import { z } from "zod";

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

export const PricesFileSchema = z
  .object({
    currency: z.string().min(1),
    retrieved_at: z.string().min(1),
    source_url: z.string().url(),
    featuredModels: z.array(z.string().min(1)).default([]),
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
