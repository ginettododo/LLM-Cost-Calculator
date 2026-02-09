export type PricingRow = {
  provider: string;
  model: string;
  release_date?: string;
  input_per_mtok: number;
  output_per_mtok?: number;
  cached_input_per_mtok?: number;
  currency: string;
  source_url: string;
  retrieved_at: string;
  pricing_confidence?: string;
};
