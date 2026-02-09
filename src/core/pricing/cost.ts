import type { PricingRow } from "../types/pricing";

export type CostBreakdown = {
  inputCostUSD: number;
  outputCostUSD: number;
  totalUSD: number;
};

export const computeCostUSD = (
  tokensIn: number,
  tokensOut: number,
  pricingRow: PricingRow,
): CostBreakdown => {
  const inputCostUSD = (tokensIn / 1_000_000) * pricingRow.input_per_mtok;
  const outputCostUSD =
    pricingRow.output_per_mtok === undefined
      ? 0
      : (tokensOut / 1_000_000) * pricingRow.output_per_mtok;

  return {
    inputCostUSD,
    outputCostUSD,
    totalUSD: inputCostUSD + outputCostUSD,
  };
};
