import { useMemo } from "react";
import { getOpenAITokenDetails } from "../../core";
import { PricingRow } from "../../core/types/pricing";

type TokenHighlighterProps = {
    text: string;
    model: PricingRow | undefined;
    isEnabled: boolean;
};

const COLORS = [
    "rgba(41, 151, 255, 0.15)", // Subtle Blue
    "rgba(0, 255, 157, 0.15)",  // Subtle Green
    "rgba(255, 179, 0, 0.15)",  // Subtle Orange
    "rgba(255, 77, 77, 0.15)",  // Subtle Red
    "rgba(170, 77, 255, 0.15)", // Subtle Purple
];

const TokenHighlighter = ({ text, model, isEnabled }: TokenHighlighterProps) => {
    const tokenDetails = useMemo(() => {
        if (!isEnabled || !model || !text) {
            return [];
        }
        // Only support OpenAI for now as per requirements/availability
        if (model.provider.toLowerCase() !== "openai") {
            return [];
        }
        return getOpenAITokenDetails(text, model.model_id ?? model.model);
    }, [text, model, isEnabled]);

    if (!isEnabled || tokenDetails.length === 0) {
        return null;
    }

    return (
        <div className="app__highlighter-layer" aria-hidden="true">
            {tokenDetails.map((token, i) => (
                <span
                    key={`${token.index}-${token.byteStart}`}
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    className="app__token-span"
                    title={`Token #${token.index}: ${JSON.stringify(token.text)} (ID: ${token.tokenId})`}
                >
                    {token.text}
                </span>
            ))}
            <br /> {/* Ensure final newline matches textarea behavior */}
        </div>
    );
};

export default TokenHighlighter;
