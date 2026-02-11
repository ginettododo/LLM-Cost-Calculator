import { useMemo } from "react";
import { computeCostUSD, getTokenCountForPricingRow } from "../../core";
import type { PricingRow } from "../../core";

export type TokenStats = {
    tokens: number;
    exactness: "exact" | "estimated";
    inputCostUSD: number;
    outputCostUSD: number;
    totalCostUSD: number;
};

export const useTokenStats = (
    text: string,
    model: PricingRow | undefined
): TokenStats | null => {
    return useMemo(() => {
        if (!model) {
            return null;
        }

        const { tokens, mode } = getTokenCountForPricingRow(text, model);
        const costs = computeCostUSD(tokens, 0, model); // Assume 0 output tokens for now, or maybe configurable later

        return {
            tokens,
            exactness: mode,
            inputCostUSD: costs.inputCostUSD,
            outputCostUSD: costs.outputCostUSD,
            totalCostUSD: costs.totalUSD,
        };
    }, [text, model]);
};
