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
import PricingTable from "../components/PricingTable";
import PrimaryModelInspector from "../components/PrimaryModelInspector";
import type { ComputeMode, VisiblePricingRow } from "../components/PricingTable";
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

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [visibleRows, setVisibleRows] = useState<VisiblePricingRow[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [computeMode, setComputeMode] = useState<ComputeMode>("visible-rows");

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
    showToast(`Preset "${preset.label}" applied`, {
      actionLabel: "Undo",
      onAction: () => setText(previousText),
    });
  };

  const toMoney = (value: number) => `$${value.toFixed(4)}`;

  const buildSummaryText = () => {
    const lines: string[] = [];

    lines.push(
      `Characters: ${counters.characters} | Words: ${counters.words} | Lines: ${counters.lines} | Bytes: ${counters.bytes}`,
    );

    const primaryRow = visibleRows[0];
    if (primaryRow) {
      lines.push(
        `Primary model: ${primaryRow.provider} ${primaryRow.model} | Tokens: ${primaryRow.tokens} | Cost: ${toMoney(primaryRow.total_cost_usd)} | ${primaryRow.exactness}`,
      );
    } else {
      lines.push("Primary model: none");
    }

    lines.push("Top 3 cheapest (input cost):");

    const topThree = [...visibleRows]
      .sort((a, b) => a.input_cost_usd - b.input_cost_usd)
      .slice(0, 3);

    if (topThree.length === 0) {
      lines.push("- none");
    } else {
      topThree.forEach((row, index) => {
        lines.push(
          `${index + 1}. ${row.provider} ${row.model} | ${toMoney(row.input_cost_usd)} input | Tokens: ${row.tokens}`,
        );
      });
    }

    return lines.join("\n");
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      showToast("Copied summary");
    } catch {
      showToast("Clipboard unavailable");
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
    showToast("CSV exported");
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
    showToast("JSON exported");
  };

  return (
    <div
      className="container"
      style={{ paddingBottom: "48px", paddingTop: "32px", minHeight: "100vh" }}
    >
      <header
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 8px 0",
              letterSpacing: "-0.02em",
            }}
          >
            LLM Cost Calculator
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Local, secure estimation of token costs for popular models.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <Button onClick={() => setIsExportOpen((open) => !open)}>Export</Button>
            {isExportOpen && (
              <Card
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "200px",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  padding: "8px",
                  gap: "4px",
                }}
                noPadding
              >
                <button
                  type="button"
                  onClick={handleExportJson}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-primary)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  JSON export
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-primary)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  CSV export
                </button>
              </Card>
            )}
          </div>

          <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </Button>
        </div>
      </header>

      {pricingError ? (
        <Card
          style={{
            marginBottom: "24px",
            borderColor: "var(--color-danger-text)",
            backgroundColor: "var(--color-danger-bg)",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: "16px" }}>Pricing data error</h2>
          <p style={{ margin: 0, color: "var(--color-danger-text)", fontSize: "14px" }}>
            {pricingError}
          </p>
        </Card>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
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
          />
        </section>

        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr", gap: "24px" }}
          className="app__responsive-grid"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                  color: "var(--color-warning-text)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                  Large input detected
                </div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>
                  Performance may be impacted. Switch to primary model mode for faster updates.
                </div>
                {computeMode !== "primary-model" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    style={{ marginTop: "12px", borderColor: "currentColor" }}
                    onClick={() => setComputeMode("primary-model")}
                  >
                    Enable high-performance mode
                  </Button>
                )}
              </Card>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <Toggle
                label="Primary model only"
                checked={computeMode === "primary-model"}
                onChange={(checked) =>
                  setComputeMode(checked ? "primary-model" : "visible-rows")
                }
              />
            </div>

            <Card style={{ overflow: "hidden" }} noPadding>
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                  Model pricing
                </h2>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  Updated: {prices.retrieved_at}
                </div>
              </div>

              <div style={{ padding: "16px" }}>
                <PricingTable
                  models={models}
                  text={debouncedText}
                  computeMode={computeMode}
                  onVisibleRowsChange={setVisibleRows}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-text-primary)",
            color: "var(--color-bg-base)",
            padding: "8px 16px",
            borderRadius: "999px",
            boxShadow: "var(--shadow-xl)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 100,
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
                color: "var(--color-primary-active)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .app__responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppView;
