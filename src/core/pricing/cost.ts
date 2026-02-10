import type { PricingRow } from "../types/pricing";

export type CostBreakdown = {
  inputCostUSD: number;
  outputCostUSD: number;
  totalUSD: number;
};

const USD_ROUNDING_DIGITS = 10;

const roundUSD = (value: number): number =>
  Number.isFinite(value) ? Number(value.toFixed(USD_ROUNDING_DIGITS)) : 0;

const sanitizeTokenCount = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export const computeCostUSD = (
  tokensIn: number,
  tokensOut: number,
  pricingRow: PricingRow,
): CostBreakdown => {
  const inputCostUSD = roundUSD(
    (sanitizeTokenCount(tokensIn) / 1_000_000) * pricingRow.input_per_mtok,
  );
  const outputCostUSD =
    pricingRow.output_per_mtok === undefined
      ? 0
      : roundUSD((sanitizeTokenCount(tokensOut) / 1_000_000) * pricingRow.output_per_mtok);
  const totalUSD = roundUSD(inputCostUSD + outputCostUSD);

  return {
    inputCostUSD,
    outputCostUSD,
    totalUSD,
  };
};
