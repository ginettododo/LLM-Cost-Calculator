import { useState, useEffect, useRef } from "react";
import { computeCostUSD, getTokenCountForPricingRowAsync } from "../../core";
import type { PricingRow } from "../../core";

export type TokenStats = {
    tokens: number;
    exactness: "exact" | "estimated";
    inputCostUSD: number;
    outputCostUSD: number;
    totalCostUSD: number;
};

export type TokenStatsConfig = {
    outputMode: "ratio" | "fixed";
    outputValue: number;
};

export const useTokenStats = (
    text: string,
    model: PricingRow | undefined,
    config: TokenStatsConfig = { outputMode: "ratio", outputValue: 0 }
): TokenStats | null => {
    const [stats, setStats] = useState<TokenStats | null>(null);

    // We keep track of the latest text content to ensure we only update for the correct version
    const latestTextRef = useRef(text);
    const latestModelRef = useRef(model);
    const latestConfigRef = useRef(config);

    useEffect(() => {
        latestTextRef.current = text;
        latestModelRef.current = model;
        latestConfigRef.current = config;
    }, [text, model, config]);

    useEffect(() => {
        if (!model) {
            setStats(null);
            return;
        }

        let isMounted = true;

        const fetchStats = async () => {
            try {
                const currentText = latestTextRef.current;
                const currentModel = latestModelRef.current;
                const currentConfig = latestConfigRef.current;

                if (!currentModel) return;

                const { tokens, mode } = await getTokenCountForPricingRowAsync(currentText, currentModel);

                if (!isMounted) return;

                // Check if we are still processing the relevant request
                if (currentText !== text || currentModel !== model) {
                    return;
                }

                // Calculate output tokens
                const outputTokens = currentConfig.outputMode === "fixed"
                    ? currentConfig.outputValue
                    : Math.ceil(tokens * currentConfig.outputValue);

                const costs = computeCostUSD(tokens, outputTokens, currentModel);

                setStats({
                    tokens,
                    exactness: mode,
                    inputCostUSD: costs.inputCostUSD,
                    outputCostUSD: costs.outputCostUSD,
                    totalCostUSD: costs.totalUSD,
                });
            } catch (err) {
                console.error("Token counting failed", err);
                if (isMounted) setStats(null);
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, [text, model, config.outputMode, config.outputValue]);

    return stats;
};
