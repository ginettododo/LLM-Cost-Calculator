import { Card, Badge, Button } from "./base";
import type { VisiblePricingRow } from "./PricingTable";

type PrimaryModelInspectorProps = {
    model: VisiblePricingRow | null;
    onCopySummary: () => void;
};

const PrimaryModelInspector = ({ model, onCopySummary }: PrimaryModelInspectorProps) => {
    if (!model) {
        return (
            <Card style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                <p style={{ margin: 0 }}>Select a model to view details</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                        Primary Estimate
                    </h3>
                    <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                        {model.provider} <span style={{ fontWeight: 400 }}>{model.model}</span>
                    </div>
                </div>
                <Badge variant={model.exactness === "exact" ? "exact" : "estimated"}>
                    {model.exactness === "exact" ? "Exact Tokenizer" : "Estimated"}
                </Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px", backgroundColor: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Tokens</div>
                    <div style={{ fontSize: "20px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{model.tokens.toLocaleString()}</div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Total Cost</div>
                    <div style={{ fontSize: "20px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--color-primary-base)" }}>${model.total_cost_usd.toFixed(5)}</div>
                </div>
            </div>

            <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                <div>
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Input:</span> ${model.input_cost_usd.toFixed(5)}
                </div>
                <div>
                    <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Output:</span> {model.output_cost_usd ? `$${model.output_cost_usd.toFixed(5)}` : "—"}
                </div>
            </div>

            <div style={{ paddingTop: "16px", borderTop: "1px solid var(--color-border-subtle)" }}>
                <Button onClick={onCopySummary} style={{ width: "100%" }}>
                    Copy Cost Summary
                </Button>
            </div>
        </Card>
    );
};

export default PrimaryModelInspector;
