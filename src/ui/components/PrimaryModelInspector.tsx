import { Card, Badge, Button } from "./base";
import type { VisiblePricingRow } from "./PricingTable";

type PrimaryModelInspectorProps = {
    model: VisiblePricingRow | null;
    onCopySummary: () => void;
};

const CopyIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const PrimaryModelInspector = ({ model, onCopySummary }: PrimaryModelInspectorProps) => {
    if (!model) {
        return (
            <Card noPadding style={{ overflow: "hidden" }}>
                <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                    <p style={{ margin: 0, fontSize: "12px" }}>Inserisci del testo per stimare il costo</p>
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
            {/* Model + badge */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{model.provider}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                        {model.model}
                    </div>
                </div>
                <Badge variant={model.exactness === "exact" ? "exact" : "estimated"}>
                    {model.exactness === "exact" ? "Esatto" : "Stim."}
                </Badge>
            </div>

            {/* Cost + tokens */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div style={{
                    padding: "10px 12px",
                    borderRight: "1px solid var(--color-border-subtle)",
                    backgroundColor: "var(--color-primary-subtle)",
                }}>
                    <div style={{ fontSize: "10px", color: "var(--color-info-text)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "2px" }}>
                        Costo totale
                    </div>
                    <div style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        color: "var(--color-primary-base)",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                    }}>
                        {formatCost(model.total_cost_usd)}
                    </div>
                </div>
                <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "2px" }}>
                        Token
                    </div>
                    <div style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                    }}>
                        {Number.isFinite(model.tokens) ? model.tokens.toLocaleString() : "—"}
                    </div>
                </div>
            </div>

            {/* Input/output breakdown + copy */}
            <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", gap: "12px" }}>
                    <div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>In</div>
                        <div style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-family-mono)", fontVariantNumeric: "tabular-nums" }}>
                            {formatCost(model.input_cost_usd)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>Out</div>
                        <div style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-family-mono)", fontVariantNumeric: "tabular-nums" }}>
                            {model.output_cost_usd !== undefined ? formatCost(model.output_cost_usd) : "—"}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<CopyIcon />}
                    onClick={onCopySummary}
                    style={{ padding: "4px 8px", height: "auto", fontSize: "11px" }}
                >
                    Copia
                </Button>
            </div>
        </Card>
    );
};

export default PrimaryModelInspector;
