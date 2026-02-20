import { useEffect, useMemo, useState } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
  validatePrices,
} from "../../core";
import type { PricingRow } from "../../core/types/pricing";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import ModelComparison from "../components/ModelComparison";
import PricingTable from "../components/PricingTable";
import PrimaryModelInspector from "../components/PrimaryModelInspector";
import type { ComputeMode, VisiblePricingRow } from "../components/PricingTable";
import { rowKey } from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import { PRESETS } from "../data/presets";
import useDebouncedValue from "../state/useDebouncedValue";
import { Toggle, Button, Card } from "../components/base";

type Theme = "light" | "dark";

type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const LARGE_INPUT_THRESHOLD = 50_000;

/* ---- Icons ---- */
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const JsonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const CsvIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CalculatorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="8.01" y2="10" strokeWidth={3} strokeLinecap="round" />
    <line x1="12" y1="10" x2="12.01" y2="10" strokeWidth={3} strokeLinecap="round" />
    <line x1="16" y1="10" x2="16.01" y2="10" strokeWidth={3} strokeLinecap="round" />
    <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth={3} strokeLinecap="round" />
    <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth={3} strokeLinecap="round" />
    <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth={3} strokeLinecap="round" />
    <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth={3} strokeLinecap="round" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={3} strokeLinecap="round" />
    <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const CompareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [visibleRows, setVisibleRows] = useState<VisiblePricingRow[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [computeMode, setComputeMode] = useState<ComputeMode>("visible-rows");
  const [scrollResetKey, setScrollResetKey] = useState(0);
  const [selectedModelKeys, setSelectedModelKeys] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const debouncedText = useDebouncedValue(text, 160);

  const { models, pricingError } = useMemo(() => {
    try {
      return { models: validatePrices(prices), pricingError: null as string | null };
    } catch (error) {
      return {
        models: [] as PricingRow[],
        pricingError: error instanceof Error ? error.message : "Failed to validate prices.",
      };
    }
  }, []);

  const counters = useMemo(() => {
    const characters = countCharacters(debouncedText);
    const words = countWords(debouncedText);
    const lines = countLines(debouncedText);
    const bytes = countBytesUtf8(debouncedText);

    return { characters, words, lines, bytes };
  }, [debouncedText]);

  const selectedModel = useMemo(() => {
    const primaryRow = visibleRows[0];
    if (!primaryRow) {
      return models[0];
    }

    return (
      models.find(
        (model) =>
          model.provider === primaryRow.provider &&
          model.model === primaryRow.model,
      ) ?? models[0]
    );
  }, [models, visibleRows]);

  // Models selected for comparison (resolved from visibleRows)
  const comparisonModels = useMemo<VisiblePricingRow[]>(() => {
    if (selectedModelKeys.size === 0) return [];
    return visibleRows.filter((row) => selectedModelKeys.has(rowKey(row)));
  }, [visibleRows, selectedModelKeys]);

  const isLargeInput = debouncedText.length > LARGE_INPUT_THRESHOLD;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  // Auto-open comparison when 2+ models are selected
  useEffect(() => {
    if (selectedModelKeys.size >= 2) {
      setComparisonOpen(true);
    }
  }, [selectedModelKeys.size]);

  const showToast = (
    message: string,
    options?: { actionLabel?: string; onAction?: () => void },
  ) => {
    setToast({
      id: Date.now(),
      message,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    const previousText = text;
    setText(preset.value);
    setScrollResetKey((k) => k + 1);
    showToast(`Preset "${preset.label}" applicato`, {
      actionLabel: "Annulla",
      onAction: () => {
        setText(previousText);
        setScrollResetKey((k) => k + 1);
      },
    });
  };

  const toMoney = (value: number) => `$${value.toFixed(4)}`;

  const buildSummaryText = () => {
    const lines: string[] = [];

    lines.push(
      `Caratteri: ${counters.characters} | Parole: ${counters.words} | Righe: ${counters.lines} | Byte: ${counters.bytes}`,
    );

    const primaryRow = visibleRows[0];
    if (primaryRow) {
      lines.push(
        `Modello primario: ${primaryRow.provider} ${primaryRow.model} | Token: ${primaryRow.tokens} | Costo: ${toMoney(primaryRow.total_cost_usd)} | ${primaryRow.exactness}`,
      );
    } else {
      lines.push("Modello primario: nessuno");
    }

    lines.push("Top 3 più economici (costo input):");

    const topThree = [...visibleRows]
      .sort((a, b) => a.input_cost_usd - b.input_cost_usd)
      .slice(0, 3);

    if (topThree.length === 0) {
      lines.push("- nessuno");
    } else {
      topThree.forEach((row, index) => {
        lines.push(
          `${index + 1}. ${row.provider} ${row.model} | ${toMoney(row.input_cost_usd)} input | Token: ${row.tokens}`,
        );
      });
    }

    return lines.join("\n");
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      showToast("Riepilogo copiato");
    } catch {
      showToast("Clipboard non disponibile");
    }
  };

  const buildExportRows = () => {
    const timestamp = new Date().toISOString();
    const common = {
      timestamp,
      characters: counters.characters,
      words: counters.words,
      lines: counters.lines,
      bytes: counters.bytes,
      last_updated: prices.retrieved_at,
    };

    return visibleRows.map((row) => ({
      ...common,
      provider: row.provider,
      model: row.model,
      exactness: row.exactness,
      tokens: row.tokens,
      input_cost_usd: Number(row.input_cost_usd.toFixed(8)),
      output_cost_usd:
        row.output_cost_usd === undefined ? null : Number(row.output_cost_usd.toFixed(8)),
      total_cost_usd: Number(row.total_cost_usd.toFixed(8)),
      price_input_per_mtok: row.price_input_per_mtok,
      price_output_per_mtok: row.price_output_per_mtok ?? null,
    }));
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return "";
    }

    const asText = String(value);
    if (/[",\n]/.test(asText)) {
      return `"${asText.replace(/"/g, '""')}"`;
    }

    return asText;
  };

  const handleExportCsv = () => {
    const rows = buildExportRows();
    const columns = [
      "timestamp",
      "characters",
      "words",
      "lines",
      "bytes",
      "last_updated",
      "provider",
      "model",
      "exactness",
      "tokens",
      "input_cost_usd",
      "output_cost_usd",
      "total_cost_usd",
      "price_input_per_mtok",
      "price_output_per_mtok",
    ] as const;

    const csvLines = [
      columns.join(","),
      ...rows.map((row) => columns.map((key) => escapeCsvValue(row[key])).join(",")),
    ];

    downloadFile(
      "llm-cost-export.csv",
      csvLines.join("\n"),
      "text/csv;charset=utf-8",
    );
    setIsExportOpen(false);
    showToast("CSV esportato");
  };

  const handleExportJson = () => {
    const payload = {
      metadata: {
        timestamp: new Date().toISOString(),
        characters: counters.characters,
        words: counters.words,
        lines: counters.lines,
        bytes: counters.bytes,
        last_updated: prices.retrieved_at,
      },
      rows: buildExportRows(),
    };

    downloadFile(
      "llm-cost-export.json",
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    setIsExportOpen(false);
    showToast("JSON esportato");
  };

  const handleCloseComparison = () => {
    setComparisonOpen(false);
    setSelectedModelKeys(new Set());
  };

  const handleRemoveFromComparison = (key: string) => {
    setSelectedModelKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      if (next.size < 2) {
        setComparisonOpen(false);
      }
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-base)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-surface)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "60px",
            gap: "16px",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--color-primary-base), var(--color-primary-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
              }}
            >
              <CalculatorIcon />
            </div>
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: "var(--color-text-primary)",
                }}
              >
                LLM Cost Calculator
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-tertiary)",
                  lineHeight: 1.2,
                }}
              >
                {models.length} modelli · aggiornato {prices.retrieved_at}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Compare button — shown when selection is active */}
            {selectedModelKeys.size >= 2 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CompareIcon />}
                onClick={() => setComparisonOpen(true)}
              >
                Confronta ({selectedModelKeys.size})
              </Button>
            )}

            {/* Export */}
            <div style={{ position: "relative" }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExportIcon />}
                onClick={() => setIsExportOpen((open) => !open)}
                aria-label="Esporta dati"
                aria-expanded={isExportOpen}
              >
                Esporta
              </Button>

              {isExportOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 49 }}
                    onClick={() => setIsExportOpen(false)}
                  />
                  <Card
                    className="animate-scale-in"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      width: "180px",
                      zIndex: 50,
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                    noPadding
                  >
                    <button type="button" className="dropdown-item" onClick={handleExportJson}>
                      <JsonIcon />
                      Esporta JSON
                    </button>
                    <button type="button" className="dropdown-item" onClick={handleExportCsv}>
                      <CsvIcon />
                      Esporta CSV
                    </button>
                  </Card>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={theme === "light" ? "Passa a tema scuro" : "Passa a tema chiaro"}
              style={{ width: "34px", padding: 0 }}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container" style={{ paddingTop: "32px", paddingBottom: "72px" }}>
        {/* Pricing data error */}
        {pricingError ? (
          <Card
            style={{
              marginBottom: "24px",
              borderColor: "var(--color-danger-text)",
              backgroundColor: "var(--color-danger-bg)",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ color: "var(--color-danger-text)", flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-danger-text)",
                  }}
                >
                  Errore dati prezzi
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-danger-text)",
                    fontSize: "13px",
                    opacity: 0.9,
                  }}
                >
                  {pricingError}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ── Input section ── */}
          <section>
            <TextareaPanel
              value={text}
              onChange={setText}
              normalizeOnPaste={normalizeOnPaste}
              removeInvisible={removeInvisible}
              onNormalizeOnPasteChange={setNormalizeOnPaste}
              onRemoveInvisibleChange={setRemoveInvisible}
              presets={PRESETS}
              onPresetSelect={handlePresetSelect}
              selectedModel={selectedModel}
              scrollResetKey={scrollResetKey}
            />
          </section>

          {/* ── Comparison panel (shown when 2+ models selected and open) ── */}
          {comparisonOpen && comparisonModels.length >= 1 && (
            <section>
              <ModelComparison
                models={comparisonModels}
                onClose={handleCloseComparison}
                onRemoveModel={handleRemoveFromComparison}
              />
            </section>
          )}

          {/* ── Stats + Table ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(280px, 310px) 1fr",
              gap: "20px",
              alignItems: "start",
            }}
            className="app__responsive-grid"
          >
            {/* Left column: stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <PrimaryModelInspector
                model={visibleRows[0] || null}
                onCopySummary={handleCopySummary}
              />
              <CountersPanel counters={counters} />

              {isLargeInput && (
                <Card
                  style={{
                    backgroundColor: "var(--color-warning-bg)",
                    borderColor: "var(--color-warning-text)",
                    borderWidth: "1px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      style={{ color: "var(--color-warning-text)", flexShrink: 0, marginTop: 1 }}
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "var(--color-warning-text)",
                          marginBottom: "2px",
                        }}
                      >
                        Input grande
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-warning-text)",
                          opacity: 0.85,
                        }}
                      >
                        Le prestazioni potrebbero risentirne. Passa alla modalità modello primario.
                      </div>
                      {computeMode !== "primary-model" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{
                            marginTop: "10px",
                            borderColor: "var(--color-warning-text)",
                            border: "1px solid",
                            color: "var(--color-warning-text)",
                          }}
                          onClick={() => setComputeMode("primary-model")}
                        >
                          Abilita alta performance
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right column: pricing table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
              {/* Table header bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Prezzi modelli
                  </h2>
                  {selectedModelKeys.size > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "var(--color-primary-base)",
                        color: "#fff",
                        borderRadius: "var(--radius-full)",
                        padding: "2px 8px",
                        fontWeight: 600,
                      }}
                    >
                      {selectedModelKeys.size} selezionati
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {selectedModelKeys.size >= 2 && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CompareIcon />}
                      onClick={() => setComparisonOpen(true)}
                    >
                      Confronta ({selectedModelKeys.size})
                    </Button>
                  )}
                  <Toggle
                    label="Solo modello primario"
                    checked={computeMode === "primary-model"}
                    onChange={(checked) =>
                      setComputeMode(checked ? "primary-model" : "visible-rows")
                    }
                  />
                </div>
              </div>

              <Card style={{ overflow: "hidden" }} noPadding>
                <div style={{ padding: "14px 16px" }}>
                  <PricingTable
                    models={models}
                    text={debouncedText}
                    computeMode={computeMode}
                    onVisibleRowsChange={setVisibleRows}
                    selectedModelKeys={selectedModelKeys}
                    onSelectionChange={setSelectedModelKeys}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className="animate-slide-up"
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-text-primary)",
            color: "var(--color-bg-base)",
            padding: "10px 18px",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-xl)",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          {toast.message}
          {toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary-hover)",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                fontSize: "13px",
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 920px) {
          .app__responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .comparison-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppView;
