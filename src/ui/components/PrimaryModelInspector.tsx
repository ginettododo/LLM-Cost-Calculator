import { Card, Badge, Button } from "./base";
import type { VisiblePricingRow } from "./PricingTable";

type PrimaryModelInspectorProps = {
    model: VisiblePricingRow | null;
    onCopySummary: () => void;
};

const CopyIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const PrimaryModelInspector = ({ model, onCopySummary }: PrimaryModelInspectorProps) => {
    if (!model) {
        return (
            <Card noPadding style={{ overflow: "hidden" }}>
                <div
                    style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        backgroundColor: "var(--color-bg-subtle)",
                    }}
                >
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Primary Estimate
                    </span>
                </div>
                <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ marginBottom: "8px", opacity: 0.4 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{ margin: 0, fontSize: "13px" }}>Enter text to see cost estimate</p>
                </div>
            </Card>
        );
    }

    const formatCost = (cost: number) => {
        if (cost === 0) return "$0.00000";
        if (cost < 0.00001) return `$${cost.toExponential(2)}`;
        return `$${cost.toFixed(5)}`;
    };

    return (
        <Card noPadding style={{ overflow: "hidden" }}>
            {/* Header */}
            <div
                style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    backgroundColor: "var(--color-bg-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Primary Estimate
                </span>
                <Badge variant={model.exactness === "exact" ? "exact" : "estimated"}>
                    {model.exactness === "exact" ? "Exact" : "Est."}
                </Badge>
            </div>

            {/* Model name */}
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                    {model.provider}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                    {model.model}
                </div>
            </div>

            {/* Key metrics: cost + tokens */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--color-border-subtle)" }}>
                {/* Total cost - emphasized */}
                <div style={{
                    padding: "14px",
                    borderRight: "1px solid var(--color-border-subtle)",
                    backgroundColor: "var(--color-primary-subtle)",
                }}>
                    <div style={{ fontSize: "11px", color: "var(--color-info-text)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "4px" }}>
                        Total Cost
                    </div>
                    <div style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "var(--color-primary-base)",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                    }}>
                        {formatCost(model.total_cost_usd)}
                    </div>
                </div>

                {/* Tokens */}
                <div style={{ padding: "14px" }}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "4px" }}>
                        Tokens
                    </div>
                    <div style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                    }}>
                        {Number.isFinite(model.tokens) ? model.tokens.toLocaleString() : "—"}
                    </div>
                </div>
            </div>

            {/* Input/output breakdown */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>Input</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-family-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {formatCost(model.input_cost_usd)}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>Output</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-family-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {model.output_cost_usd !== undefined ? formatCost(model.output_cost_usd) : "—"}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>Per 1M in</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-family-mono)", fontVariantNumeric: "tabular-nums" }}>
                        ${model.price_input_per_mtok.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Copy button */}
            <div style={{ padding: "10px 14px" }}>
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<CopyIcon />}
                    onClick={onCopySummary}
                    style={{ width: "100%", justifyContent: "center" }}
                >
                    Copy Summary
                </Button>
            </div>
        </Card>
    );
};

export default PrimaryModelInspector;
