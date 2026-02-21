import { Badge, Button } from "./base";
import type { VisiblePricingRow } from "./PricingTable";

type ModelComparisonProps = {
  models: VisiblePricingRow[];
  onClose: () => void;
  onRemoveModel: (key: string) => void;
};

const modelKey = (row: VisiblePricingRow) => `${row.provider}::${row.model}`;

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ModelComparison = ({ models, onClose, onRemoveModel }: ModelComparisonProps) => {
  if (models.length === 0) return null;

  const hasText = models.some((m) => m.total_cost_usd > 0);
  const lowestCost = hasText ? Math.min(...models.map((m) => m.total_cost_usd)) : null;
  const lowestInput = Math.min(...models.map((m) => m.price_input_per_mtok));

  const formatCost = (cost: number) => {
    if (cost === 0) return "$0.00000";
    if (cost < 0.00001) return `$${cost.toExponential(2)}`;
    return `$${cost.toFixed(5)}`;
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        border: "1px solid var(--color-primary-muted)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          backgroundColor: "var(--color-primary-subtle)",
          borderBottom: "1px solid var(--color-primary-muted)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-info-text)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Confronto ({models.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Chiudi confronto"
          style={{ color: "var(--color-info-text)", padding: "4px 8px", height: "auto" }}
        >
          <CloseIcon />
          <span style={{ marginLeft: 4 }}>Chiudi</span>
        </Button>
      </div>

      {/* Model cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(models.length, 4)}, minmax(0, 1fr))`,
          gap: 0,
          overflowX: "auto",
        }}
        className="comparison-grid"
      >
        {models.map((model, idx) => {
          const key = modelKey(model);
          const isCheapest =
            hasText && lowestCost !== null && model.total_cost_usd === lowestCost && models.length > 1;
          const isCheapestInput = model.price_input_per_mtok === lowestInput && models.length > 1;

          return (
            <div
              key={key}
              style={{
                borderRight: idx < models.length - 1 ? "1px solid var(--color-border-subtle)" : undefined,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Model header */}
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  backgroundColor: isCheapest ? "var(--color-success-bg)" : "transparent",
                  minHeight: "80px",
                }}
              >
                {isCheapest && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "6px",
                      color: "var(--color-success-text)",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    <TrophyIcon />
                    Più economico
                  </div>
                )}
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-tertiary)",
                    marginBottom: "2px",
                    fontWeight: 500,
                  }}
                >
                  {model.provider}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {model.model}
                </div>
              </div>

              {/* Cost section */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  backgroundColor: isCheapest ? "rgba(var(--color-success-bg), 0.3)" : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Costo totale stimato
                </div>
                {hasText ? (
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: isCheapest ? "var(--color-success-text)" : "var(--color-text-primary)",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {formatCost(model.total_cost_usd)}
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                    Inserisci del testo
                  </div>
                )}
                {hasText && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <span>In: {formatCost(model.input_cost_usd)}</span>
                    {model.output_cost_usd !== undefined && (
                      <span>· Out: {formatCost(model.output_cost_usd)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tokens section */}
              {hasText && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                      marginBottom: "3px",
                    }}
                  >
                    Token
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Number.isFinite(model.tokens) ? model.tokens.toLocaleString() : "—"}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <Badge variant={model.exactness === "exact" ? "exact" : "estimated"}>
                      {model.exactness === "exact" ? "Esatto" : "Stimato"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Pricing per 1M */}
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border-subtle)", flex: 1 }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Prezzo per 1M token
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Input</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "var(--font-family-mono)",
                        color: isCheapestInput ? "var(--color-success-text)" : "var(--color-text-primary)",
                      }}
                    >
                      ${model.price_input_per_mtok.toFixed(2)}
                      {isCheapestInput && <TrophyIcon />}
                    </span>
                  </div>
                  {model.price_output_per_mtok !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Output</span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          fontFamily: "var(--font-family-mono)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        ${model.price_output_per_mtok.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <div style={{ padding: "8px 12px" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveModel(key)}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "11px",
                    color: "var(--color-text-tertiary)",
                    height: "26px",
                  }}
                >
                  Rimuovi
                </Button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ModelComparison;
