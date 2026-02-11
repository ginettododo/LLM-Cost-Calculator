import { useEffect, useMemo, useState, useId } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
} from "../../core/counters";
import { estimateTokens, formatUSD, validatePrices } from "../../core";
import type { PricingRow, PricingValidationError } from "../../core";
import prices from "../../data/prices.json";
import PricingTable from "../components/PricingTable";
import type { VisiblePricingRow } from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import TokenDebugPanel from "../components/TokenDebugPanel";
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

const HARD_INPUT_THRESHOLD = 200_000;

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [visibleRows, setVisibleRows] = useState<VisiblePricingRow[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Compute mode is now automatic based on input size
  // const [computeMode, setComputeMode] = useState<ComputeMode>("primary-model"); 

  const [primaryModelKey, setPrimaryModelKey] = useState("");
  const [undoPreset, setUndoPreset] = useState<UndoPresetState | null>(null);

  // Debug panel hidden by default
  const [showDebug, setShowDebug] = useState(false);
  const [showCounterDetails, setShowCounterDetails] = useState(false);

  // Pricing table open state
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const debouncedText = useDebouncedValue(text, 40);
  const themeToggleId = useId();
  const primaryModelId = useId();

  const pricingValidation = useMemo(() => {
    try {
      return { models: validatePrices(prices), error: null };
    } catch (error) {
      const fallback: PricingValidationError = {
        message: "Invalid pricing data.",
        issues: [{ path: "root", message: "Unexpected pricing validation failure." }],
      };
      const asValidationError =
        typeof error === "object" &&
          error !== null &&
          "issues" in error &&
          Array.isArray((error as PricingValidationError).issues)
          ? (error as PricingValidationError)
          : fallback;

      return { models: [], error: asValidationError };
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
    const candidates = [prices.retrieved_at].filter(Boolean);
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

  const isHugeInput = debouncedText.length >= HARD_INPUT_THRESHOLD;
  // Always use primary-model mode for very large inputs implicitly
  const effectiveComputeMode = isHugeInput ? "primary-model" : "visible-rows";

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const prioritizePrimaryModel = (rows: VisiblePricingRow[]): VisiblePricingRow | undefined => {
    // Default to GPT-4o or similar high-value model if available
    const preferredOrder = ["openai:gpt-4o", "openai:gpt-4-turbo", "anthropic:claude-3-5-sonnet"];

    for (const modelId of preferredOrder) {
      const found = rows.find(row =>
        (row.provider.toLowerCase() + ":" + row.model.toLowerCase()).includes(modelId.split(":")[1]) ||
        row.model.toLowerCase().includes(modelId.split(":")[1])
      );
      if (found) return found;
    }

    const exactOpenAI = rows
      .filter((row) => row.exactness === "exact" && row.provider.trim().toLowerCase() === "openai")
      .sort((a, b) => a.price_input_per_mtok - b.price_input_per_mtok);

    return exactOpenAI[0] ?? rows[0];
  };

  useEffect(() => {
    if (visibleRows.length === 0) {
      setPrimaryModelKey("");
      return;
    }

    // specific exact text
    const selectedRow = visibleRows.find(
      (row) => `${row.provider}::${row.model}` === primaryModelKey,
    );

    const needsSelection =
      !selectedRow || (debouncedText.trim().length > 0 && selectedRow.tokens === 0 && selectedRow.exactness === "exact");

    if (needsSelection) {
      // Only auto-switch if we don't have a valid selection or the current selection is invalid
      if (!primaryModelKey || !selectedRow) {
        const preferred = prioritizePrimaryModel(visibleRows);
        if (preferred) {
          setPrimaryModelKey(`${preferred.provider}::${preferred.model}`);
        }
      }
    }
  }, [debouncedText, primaryModelKey, visibleRows]);

  useEffect(() => {
    if (pricingValidation.error) {
      setVisibleRows([]);
    }
  }, [pricingValidation.error]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!undoPreset) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setText(undoPreset.text);
        setUndoPreset(null);
        showToast("Preset undone");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undoPreset]);

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

  const primaryModel = useMemo(() => {
    // If we have a key, try to find it in visible rows
    const selected = visibleRows.find((row) => `${row.provider}::${row.model}` === primaryModelKey);

    // If not found (e.g. filtered out), fall back to the first visible row or keep using the detailed info if we can find it in the full list (not implemented here for simplicity, assuming visible rows source of truth)
    if (!selected && visibleRows.length > 0) {
      return visibleRows[0];
    }

    return selected;
  }, [primaryModelKey, visibleRows]);


  // Sort visibility rows by Provider then Model
  const sortedModels = useMemo<PricingRow[]>(() => {
    const sorted = [...pricingValidation.models].sort((a, b) => {
      const providerCmd = a.provider.localeCompare(b.provider);
      if (providerCmd !== 0) return providerCmd;
      return a.model.localeCompare(b.model);
    });

    return sorted;
  }, [pricingValidation.models]);



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

    if (typeof window.prompt === "function") {
      window.prompt("Copy summary", summary);
      showToast("Clipboard blocked. Manual copy prompt opened.");
      return;
    }

    showToast("Clipboard unavailable. Select and copy manually.");
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
      rows: buildExportRows().map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { timestamp, characters, words, lines, bytes, last_updated, ...rest } = row;
        return rest;
      }),
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
      <header className="app__header-main">
        {/* Top Bar with basic actions */}
        <div className="app__top-bar">
          <div className="app__brand">LLM Calculator <span className="app__tagary">BETA</span></div>
          <div className="app__actions-row">
            <Toggle
              id={themeToggleId}
              label="Light"
              checked={theme === "light"}
              onChange={(event) => setTheme(event.target.checked ? "light" : "dark")}
            />
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? "Hide Debug" : "Data"}
            </Button>
          </div>
        </div>

        {/* Primary Calculator Display */}
        <div className="app__calculator-display">
          <div className="app__model-selector-large">
            <label htmlFor={primaryModelId} className="app__label-large">Model</label>
            <select
              id={primaryModelId}
              className="app__select-large"
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
                    {row.provider} / {row.model}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="app__big-stats">
            <div className="app__big-stat-item">
              <span className="app__label-stat">Estimated Cost</span>
              <span className="app__value-stat app__value-stat--cost">
                {primaryModel ? toMoney(primaryModel.total_cost_usd) : "$0.00"}
              </span>
            </div>
            <div className="app__big-stat-item">
              <span className="app__label-stat">
                Token Count
                {primaryModel?.exactness === 'exact' && <Badge tone="success">EXACT</Badge>}
                {primaryModel?.exactness === 'estimated' && <Badge tone="warning">EST</Badge>}
              </span>
              <span className="app__value-stat">
                {primaryModel && primaryModel.tokens > 0
                  ? primaryModel.tokens.toLocaleString()
                  : debouncedText.trim().length > 0
                    ? estimatedTokens.toLocaleString()
                    : "0"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="app__main-content">
        <section className="app__section-input">
          <TextareaPanel
            value={text}
            onChange={setText}
            normalizeOnPaste={normalizeOnPaste}
            removeInvisible={removeInvisible}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
            onUndoPreset={handleUndoPreset}
            canUndoPreset={Boolean(undoPreset)}
            onNormalizeOnPasteChange={setNormalizeOnPaste}
            onRemoveInvisibleChange={setRemoveInvisible}
            characterCount={counters.characters}
            estimatedTokens={estimatedTokens}
            isExportOpen={isExportOpen}
            onExportToggle={() => setIsExportOpen((prev) => !prev)}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onCopySummary={handleCopySummary}
            copySummaryDisabled={debouncedText.length === 0}
          />
        </section>

        {/* Token Debugger (Conditional) */}
        {showDebug && (
          <section className="app__section-debug">
            <Card className="app__stats-card" variant="inset">
              <div className="app__kpi-row">
                <div className="app__kpi-chip">
                  <span>Characters</span>
                  <strong>{counters.characters.toLocaleString()}</strong>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCounterDetails((prev) => !prev)}
              >
                {showCounterDetails ? "Hide details" : "Show details"}
              </Button>
              {showCounterDetails ? (
                <div className="app__details-inline">
                  <span>Words: {counters.words.toLocaleString()}</span>
                  <span>Lines: {counters.lines.toLocaleString()}</span>
                  <span>Bytes: {counters.bytes.toLocaleString()}</span>
                </div>
              ) : null}
              <TokenDebugPanel
                text={debouncedText}
                openAIModels={sortedModels.filter(m => m.provider.toLowerCase() === 'openai')}
              />
            </Card>
          </section>
        )}

        <section className="app__section-table">
          <Card>
            <div className="app__card-header-interact" onClick={() => setIsPricingOpen(!isPricingOpen)}>
              <div>
                <h2>All Models Comparison</h2>
                <p className="app__muted">
                  {visibleRows.length} models available. Last updated: {lastUpdated}
                </p>
              </div>
              <Button variant="ghost" size="sm">{isPricingOpen ? "Collapse" : "Expand"}</Button>
            </div>

            {(isPricingOpen || debouncedText.length === 0) && (
              <div className="app__table-container">
                {pricingValidation.error ? (
                  <div className="app__error-panel" role="status" aria-live="polite">
                    <h3>Pricing data issue</h3>
                    <p>
                      We could not load the pricing data safely. Please refresh the page or verify
                      the bundled pricing JSON format.
                    </p>
                    <ul>
                      {pricingValidation.error.issues.slice(0, 4).map((issue) => (
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
              </div>
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
              aria-label={`Toast action: ${toast.actionLabel}`}
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
        <p>100% offline · Prices from public sources</p>
      </footer>
    </div>
  );
};

export default AppView;
