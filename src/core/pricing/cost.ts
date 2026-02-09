import type { PricingRow } from "../types/pricing";

export type CostBreakdown = {
  inputCostUSD: number;
  outputCostUSD: number;
  totalUSD: number;
};

const USD_ROUNDING_DIGITS = 10;

const roundUSD = (value: number): number =>
  Number(value.toFixed(USD_ROUNDING_DIGITS));

export const computeCostUSD = (
  tokensIn: number,
  tokensOut: number,
  pricingRow: PricingRow,
): CostBreakdown => {
  const inputCostUSD = roundUSD(
    (tokensIn / 1_000_000) * pricingRow.input_per_mtok,
  );
  const outputCostUSD =
    pricingRow.output_per_mtok === undefined
      ? 0
      : roundUSD((tokensOut / 1_000_000) * pricingRow.output_per_mtok);
  const totalUSD = roundUSD(inputCostUSD + outputCostUSD);

  return {
    inputCostUSD,
    outputCostUSD,
    totalUSD,
  };
};
