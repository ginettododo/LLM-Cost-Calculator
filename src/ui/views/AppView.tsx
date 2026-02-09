import { useEffect, useMemo, useState } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
} from "../../core/counters";
import { estimateTokens } from "../../core";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import PricingTable from "../components/PricingTable";
import type { ComputeMode, VisiblePricingRow } from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import useDebouncedValue from "../state/useDebouncedValue";

type Theme = "light" | "dark";
type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const PRESETS: Array<{ id: string; label: string; value: string }> = [
  {
    id: "short-paragraph",
    label: "Short paragraph",
    value:
      "Product teams iterate faster when measurements stay visible and simple. " +
      "A tiny utility that estimates tokens can prevent expensive surprises.",
  },
  {
    id: "long-article",
    label: "Long article (~5k chars)",
    value: Array.from({ length: 34 })
      .map(
        (_, index) =>
          `Section ${index + 1}: Reliable product planning balances user impact, ` +
          "implementation cost, and long-term maintainability. ",
      )
      .join(""),
  },
  {
    id: "code-sample-json",
    label: "Code sample (JSON)",
    value: `{
  "project": "LLM Cost Calculator",
  "version": "1.0.0",
  "features": ["export", "clipboard-summary", "presets", "theme-toggle"],
  "limits": {
    "network_calls": false,
    "storage_required": false
  },
  "meta": {
    "owner": "frontend-team",
    "a11y_checked": true
  }
}`,
  },
  {
    id: "mixed-unicode",
    label: "Mixed unicode (emoji + accents)",
    value:
      "Résumé ready: naïve café users love jalapeño tacos 🌮 and crème brûlée. " +
      "Emoji mix: 🚀✨🎯. Greek: Καλημέρα. Japanese: こんにちは. Arabic: مرحبا.",
  },
];

const LARGE_INPUT_THRESHOLD = 50_000;

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [visibleRows, setVisibleRows] = useState<VisiblePricingRow[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [computeMode, setComputeMode] = useState<ComputeMode>("all-models");
  const debouncedText = useDebouncedValue(text, 160);

  const counters = useMemo(() => {
    const characters = countCharacters(debouncedText);
    const words = countWords(debouncedText);
    const lines = countLines(debouncedText);
    const bytes = countBytesUtf8(debouncedText);

    return { characters, words, lines, bytes };
  }, [debouncedText]);

  const estimatedTokens = useMemo(() => {
    return estimateTokens(debouncedText);
  }, [debouncedText]);

  const isLargeInput = debouncedText.length > LARGE_INPUT_THRESHOLD;

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
      onAction: () => {
        setText(previousText);
      },
    });
  };

  const toMoney = (value: number) => `$${value.toFixed(4)}`;

  const buildSummaryText = () => {
    const lines: string[] = [];
    lines.push(
      `Characters: ${counters.characters} | Words: ${counters.words} | Lines: ${counters.lines}`,
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
          `${index + 1}. ${row.provider} ${row.model} | ${toMoney(
            row.input_cost_usd,
          )} input | Tokens: ${row.tokens}`,
        );
      });
    }

    return lines.join("\n");
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      showToast("Copied");
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
        row.output_cost_usd === undefined
          ? null
          : Number(row.output_cost_usd.toFixed(8)),
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
      return `"${asText.replace(/"/g, "\"\"")}"`;
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

    downloadFile("llm-cost-export.csv", csvLines.join("\n"), "text/csv;charset=utf-8");
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
      rows: buildExportRows().map(
        ({
          timestamp: _timestamp,
          characters: _characters,
          words: _words,
          lines: _lines,
          bytes: _bytes,
          last_updated: _lastUpdated,
          ...row
        }) => row,
      ),
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
    <div className="app" data-theme={theme}>
      <header className="app__header">
        <div className="app__header-row">
          <div>
            <h1>Token &amp; LLM Cost Calculator</h1>
            <p className="app__subtitle">
              All calculations run locally in your browser. Tokenization is coming soon.
            </p>
          </div>
          <button
            type="button"
            className="app__button app__button--theme"
            aria-label="Toggle color mode"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="app__panel">
          <TextareaPanel
            value={text}
            onChange={setText}
            normalizeOnPaste={normalizeOnPaste}
            removeInvisible={removeInvisible}
            onNormalizeOnPasteChange={setNormalizeOnPaste}
            onRemoveInvisibleChange={setRemoveInvisible}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
          />
        </section>

        <section className="app__panel app__panel--grid">
          <div className="app__card">
            <div className="app__card-header">
              <h2>Token Estimate</h2>
              <button
                type="button"
                className="app__button"
                onClick={handleCopySummary}
                disabled={visibleRows.length === 0}
              >
                Copy summary
              </button>
            </div>
            <div className="app__token-placeholder">
              <span className="app__token-value">
                Tokens: {estimatedTokens.toLocaleString()}
              </span>
              <span className="app__token-badge">Estimated</span>
            </div>
            <p className="app__hint app__hint--tight">
              Token estimate uses char/4 until exact tokenizer is enabled.
            </p>
            {isLargeInput ? (
              <div className="app__warning" role="status" aria-live="polite">
                <strong>Large input detected ({debouncedText.length.toLocaleString()} chars).</strong>
                <span>
                  Switch to primary model mode for faster updates on large payloads.
                </span>
                {computeMode !== "primary-model" ? (
                  <button
                    type="button"
                    className="app__button app__button--warning"
                    onClick={() => setComputeMode("primary-model")}
                  >
                    Enable primary model mode
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <CountersPanel counters={counters} />
        </section>

        <section className="app__panel">
          <div className="app__card">
            <div className="app__card-header">
              <div>
                <h2>Pricing Table</h2>
                <p className="app__muted">
                  Pricing data last updated: {prices.retrieved_at}
                </p>
                <label className="app__toggle app__toggle--mode">
                  <input
                    type="checkbox"
                    checked={computeMode === "primary-model"}
                    onChange={(event) =>
                      setComputeMode(
                        event.target.checked ? "primary-model" : "all-models",
                      )
                    }
                  />
                  <span>Primary model only</span>
                </label>
              </div>
              <div className="app__menu">
                <button
                  type="button"
                  className="app__button"
                  aria-haspopup="menu"
                  aria-expanded={isExportOpen}
                  onClick={() => setIsExportOpen((prev) => !prev)}
                >
                  Export
                </button>
                {isExportOpen ? (
                  <div className="app__menu-panel" role="menu" aria-label="Export options">
                    <button
                      type="button"
                      className="app__menu-item"
                      role="menuitem"
                      onClick={handleExportCsv}
                    >
                      Export current results to CSV
                    </button>
                    <button
                      type="button"
                      className="app__menu-item"
                      role="menuitem"
                      onClick={handleExportJson}
                    >
                      Export current results to JSON
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <PricingTable
              models={prices.models}
              text={debouncedText}
              computeMode={computeMode}
              onVisibleRowsChange={setVisibleRows}
            />
          </div>
        </section>
      </main>
      <div className="app__sr-live" role="status" aria-live="polite" aria-atomic="true">
        {toast?.message ?? ""}
      </div>
      {toast ? (
        <div className="app__toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              className="app__button app__button--toast"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default AppView;
