import type { OpenAITokenDetail } from "../../core/tokenization/openaiTokenizer";

type TokenHighlighterProps = {
    tokenDetails: OpenAITokenDetail[];
    isEnabled: boolean;
};

const COLORS = [
    "rgba(41, 151, 255, 0.15)", // Subtle Blue
    "rgba(0, 255, 157, 0.15)",  // Subtle Green
    "rgba(255, 179, 0, 0.15)",  // Subtle Orange
    "rgba(255, 77, 77, 0.15)",  // Subtle Red
    "rgba(170, 77, 255, 0.15)", // Subtle Purple
];

const TokenHighlighter = ({ tokenDetails, isEnabled }: TokenHighlighterProps) => {
    const MAX_TOKENS = 5000;
    const isTruncated = tokenDetails.length > MAX_TOKENS;
    const displayTokens = isTruncated ? tokenDetails.slice(0, MAX_TOKENS) : tokenDetails;

    if (!isEnabled || tokenDetails.length === 0) {
        return null;
    }

    return (
        <div className="app__highlighter-layer" aria-hidden="true">
            {displayTokens.map((token, i) => (
                <span
                    key={`${token.index}-${token.byteStart}`}
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    className="app__token-span"
                >
                    {token.text}
                </span>
            ))}
            {isTruncated && (
                <div className="app__highlighter-warning">
                    Highlighter limited to first {MAX_TOKENS} tokens for performance
                </div>
            )}
            <br /> {/* Ensure final newline matches textarea behavior */}
        </div>
    );
};

export default TokenHighlighter;
