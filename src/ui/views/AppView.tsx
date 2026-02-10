import { useEffect, useMemo, useState, useId } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
} from "../../core/counters";
import { estimateTokens, formatUSD, validatePrices } from "../../core";
import type { PricingValidationError } from "../../core";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import PricingTable from "../components/PricingTable";
import type { ComputeMode, VisiblePricingRow } from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import useDebouncedValue from "../state/useDebouncedValue";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import Button from "../components/ui/Button";
import { PRESETS } from "../data/presets";

type Theme = "light" | "dark";
type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};
type UndoPresetState = {
  text: string;
  label: string;
};

const SOFT_INPUT_THRESHOLD = 50_000;
const HARD_INPUT_THRESHOLD = 200_000;

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [visibleRows, setVisibleRows] = useState<VisiblePricingRow[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [computeMode, setComputeMode] =
    useState<ComputeMode>("visible-rows");
  const [primaryModelKey, setPrimaryModelKey] = useState("");
  const [undoPreset, setUndoPreset] = useState<UndoPresetState | null>(null);
  const debouncedText = useDebouncedValue(text, 160);
  const themeToggleId = useId();
  const primaryModelId = useId();

  const pricingValidation = useMemo(() => {
    try {
      return { models: validatePrices(prices), error: null };
    } catch (error) {
      return { models: [], error: error as PricingValidationError };
    }
  }, []);

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

  const lastUpdated = useMemo(() => {
    const candidates = [prices.retrieved_at, ...prices.models.map((model) => model.retrieved_at)]
      .filter(Boolean);
    if (candidates.length === 0) {
      return "";
    }
    let latest = candidates[0];
    let latestTime = Date.parse(latest);
    candidates.slice(1).forEach((candidate) => {
      const candidateTime = Date.parse(candidate);
      if (candidateTime > latestTime) {
        latest = candidate;
        latestTime = candidateTime;
      }
    });
    return latest;
  }, []);

  const isLargeInput = debouncedText.length >= SOFT_INPUT_THRESHOLD;
  const isHugeInput = debouncedText.length >= HARD_INPUT_THRESHOLD;
  const effectiveComputeMode = isHugeInput ? "primary-model" : computeMode;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (visibleRows.length === 0) {
      setPrimaryModelKey("");
      return;
    }

    const hasSelection = visibleRows.some(
      (row) => `${row.provider}::${row.model}` === primaryModelKey,
    );
    if (!hasSelection) {
      setPrimaryModelKey(`${visibleRows[0].provider}::${visibleRows[0].model}`);
    }
  }, [primaryModelKey, visibleRows]);

  useEffect(() => {
    if (pricingValidation.error) {
      setVisibleRows([]);
    }
  }, [pricingValidation.error]);

  useEffect(() => {
    if (!isHugeInput || computeMode === "primary-model") {
      return;
    }
    setComputeMode("primary-model");
    showToast("Large input: switched to primary model mode");
  }, [computeMode, isHugeInput]);

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
    setUndoPreset({ text: previousText, label: preset.label });
    showToast(`Preset "${preset.label}" applied`, {
      actionLabel: "Undo",
      onAction: () => {
        setText(previousText);
        setUndoPreset(null);
      },
    });
  };

  const toMoney = (value: number) => formatUSD(value);

  const handleUndoPreset = () => {
    if (!undoPreset) {
      return;
    }
    setText(undoPreset.text);
    setUndoPreset(null);
    showToast("Preset undone");
  };

  const primaryModel = useMemo(
    () => visibleRows.find((row) => `${row.provider}::${row.model}` === primaryModelKey),
    [primaryModelKey, visibleRows],
  );

  const buildSummaryText = () => {
    const lines: string[] = [];
    lines.push(
      `Characters: ${counters.characters} | Words: ${counters.words} | Lines: ${counters.lines}`,
    );

    if (primaryModel) {
      lines.push(
        `Primary model: ${primaryModel.provider} ${primaryModel.model} | Tokens: ${primaryModel.tokens} | Cost: ${toMoney(primaryModel.total_cost_usd)} | ${primaryModel.exactness}`,
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
    const summary = buildSummaryText();
    const attemptLegacyCopy = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = summary;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
        showToast("Copied");
        return;
      }
    } catch {
      // fall back
    }

    if (attemptLegacyCopy()) {
      showToast("Copied");
      return;
    }

    window.prompt("Copy summary", summary);
    showToast("Clipboard blocked. Manual copy prompt opened.");
  };

  const buildExportRows = () => {
    const timestamp = new Date().toISOString();
    const common = {
      timestamp,
      characters: counters.characters,
      words: counters.words,
      lines: counters.lines,
      bytes: counters.bytes,
      last_updated: lastUpdated,
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
        last_updated: lastUpdated,
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
              All calculations run locally in your browser with no server calls.
            </p>
          </div>
          <Toggle
            id={themeToggleId}
            label="Light mode"
            description="Dark is default"
            checked={theme === "light"}
            onChange={(event) =>
              setTheme(event.target.checked ? "light" : "dark")
            }
          />
        </div>
      </header>

      <main className="app__main">
        <section className="app__section app__section--top">
          <TextareaPanel
            value={text}
            onChange={setText}
            normalizeOnPaste={normalizeOnPaste}
            removeInvisible={removeInvisible}
            onNormalizeOnPasteChange={setNormalizeOnPaste}
            onRemoveInvisibleChange={setRemoveInvisible}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
            onUndoPreset={handleUndoPreset}
            canUndoPreset={Boolean(undoPreset)}
            onCopySummary={handleCopySummary}
            copySummaryDisabled={visibleRows.length === 0}
            isExportOpen={isExportOpen}
            onExportToggle={() => setIsExportOpen((prev) => !prev)}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            characterCount={counters.characters}
            estimatedTokens={estimatedTokens}
          />
          <aside className="app__inspector">
            <Card className="app__summary-card">
              <div className="app__card-header">
                <div>
                  <h2>Primary Model</h2>
                  <p className="app__muted">Inspector for tokens and spend.</p>
                </div>
                <Badge
                  tone={effectiveComputeMode === "primary-model" ? "success" : "neutral"}
                >
                  {effectiveComputeMode === "primary-model"
                    ? "Primary only"
                    : "Visible rows"}
                </Badge>
              </div>
              <div className="app__field">
                <label htmlFor="compute-mode" className="app__label">
                  Computation mode
                </label>
                <select
                  id="compute-mode"
                  className="app__select"
                  value={effectiveComputeMode}
                  onChange={(event) =>
                    setComputeMode(event.target.value as ComputeMode)
                  }
                  disabled={isHugeInput}
                >
                  <option value="visible-rows">
                    Visible rows (default)
                  </option>
                  <option value="primary-model">Primary model only (fast)</option>
                </select>
                <p className="app__hint">
                  Visible rows computes the filtered table. Primary model only
                  computes the top row for speed.
                </p>
              </div>
              <div className="app__field">
                <label htmlFor={primaryModelId} className="app__label">
                  Choose primary model
                </label>
                <select
                  id={primaryModelId}
                  className="app__select"
                  value={primaryModelKey}
                  onChange={(event) => setPrimaryModelKey(event.target.value)}
                  disabled={visibleRows.length === 0}
                >
                  {visibleRows.length === 0 ? (
                    <option value="">No models available</option>
                  ) : (
                    visibleRows.map((row) => (
                      <option
                        key={`${row.provider}-${row.model}`}
                        value={`${row.provider}::${row.model}`}
                      >
                        {row.provider} · {row.model}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="app__summary-grid">
                <div className="app__summary-item">
                  <span className="app__label">Tokens</span>
                  <span className="app__value">
                    {primaryModel?.tokens.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="app__summary-item">
                  <span className="app__label">Total cost</span>
                  <span className="app__value">
                    {primaryModel ? toMoney(primaryModel.total_cost_usd) : "—"}
                  </span>
                </div>
                <div className="app__summary-item">
                  <span className="app__label">Count type</span>
                  <span className="app__value">
                    {primaryModel ? (
                      <Badge
                        tone={
                          primaryModel.exactness === "exact" ? "success" : "warning"
                        }
                      >
                        {primaryModel.exactness === "exact" ? "Exact" : "Estimated"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>
              {isLargeInput ? (
                <div
                  className={
                    isHugeInput
                      ? "app__warning app__warning--critical"
                      : "app__warning"
                  }
                  role="status"
                  aria-live="polite"
                >
                  <strong>
                    {isHugeInput
                      ? "Very large input detected"
                      : "Large input detected"}{" "}
                    ({debouncedText.length.toLocaleString()} chars).
                  </strong>
                  <span>
                    {isHugeInput
                      ? "Primary model mode is enforced to prevent slowdowns."
                      : "Switch to primary model mode for faster updates."}
                  </span>
                  {!isHugeInput && computeMode !== "primary-model" ? (
                    <Button
                      variant="warning"
                      onClick={() => setComputeMode("primary-model")}
                    >
                      Enable primary model mode
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </Card>
            <CountersPanel counters={counters} />
          </aside>
        </section>

        <section className="app__section">
          <Card>
            <div className="app__card-header">
              <div>
                <h2>Pricing Table</h2>
                <p className="app__muted">
                  Pricing data last updated: {lastUpdated}
                </p>
              </div>
              <Badge
                tone={effectiveComputeMode === "primary-model" ? "success" : "neutral"}
              >
                {effectiveComputeMode === "primary-model"
                  ? "Primary only"
                  : "Visible rows"}
              </Badge>
            </div>
            {pricingValidation.error ? (
              <div className="app__error-panel" role="status" aria-live="polite">
                <h3>Pricing data issue</h3>
                <p>
                  We could not load the pricing data. Try refreshing or check the
                  data source.
                </p>
                <ul>
                  {pricingValidation.error.issues.slice(0, 3).map((issue) => (
                    <li key={`${issue.path}-${issue.message}`}>
                      <strong>{issue.path || "root"}</strong>: {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <PricingTable
                models={pricingValidation.models}
                text={debouncedText}
                computeMode={effectiveComputeMode}
                onVisibleRowsChange={setVisibleRows}
              />
            )}
          </Card>
        </section>
      </main>
      <div className="app__sr-live" role="status" aria-live="polite" aria-atomic="true">
        {toast?.message ?? ""}
      </div>
      {toast ? (
        <div className="app__toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      <footer className="app__footer">
        <p>100% offline · No data ever leaves your browser · Prices from public APIs</p>
      </footer>
    </div>
  );
};

export default AppView;
