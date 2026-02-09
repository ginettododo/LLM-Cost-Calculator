export type PricingRow = {
  provider: string;
  model: string;
  model_id: string;
  release_date?: string;
  modality: "text" | "audio" | "realtime" | "multimodal";
  input_per_mtok: number;
  output_per_mtok?: number;
  cached_input_per_mtok?: number;
  currency: string;
  source_url: string;
  retrieved_at: string;
  pricing_confidence: "high" | "medium" | "low";
  pricing_tier?: string;
  is_tiered?: boolean;
  tokenization?: "exact" | "estimated";
  notes?: string;
};
