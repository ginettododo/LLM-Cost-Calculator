import { useEffect, useMemo, useRef, useState } from "react";
import { computeCostUSD, formatUSD, getTokenCountForPricingRow } from "../../core";
import type { PricingRow } from "../../core/types/pricing";
import Badge from "./ui/Badge";
import Toggle from "./ui/Toggle";
import Tooltip from "./ui/Tooltip";
import TableShell from "./ui/TableShell";
import Popover from "./ui/Popover";

type PricingTableProps = {
  models: PricingRow[];
  text: string;
  computeMode: ComputeMode;
  onVisibleRowsChange?: (rows: VisiblePricingRow[]) => void;
};

type SortKey = "provider" | "model" | "release_date" | "input" | "output";
type SortDirection = "asc" | "desc";
export type ComputeMode = "visible-rows" | "primary-model";

type RenderRow = VisiblePricingRow & {
  release_date?: string;
  pricing_tier?: string;
  notes?: string;
};

export type VisiblePricingRow = {
  provider: string;
  model: string;
  modality: PricingRow["modality"];
  tokenization?: PricingRow["tokenization"];
  is_tiered?: boolean;
  exactness: "exact" | "estimated";
  tokens: number;
  input_cost_usd: number;
  output_cost_usd?: number;
  total_cost_usd: number;
  price_input_per_mtok: number;
  price_output_per_mtok?: number;
};

const PricingTable = ({
  models,
  text,
  computeMode,
  onVisibleRowsChange,
}: PricingTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [exactOnly, setExactOnly] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [tieredOnly, setTieredOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("provider");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [rowsForRender, setRowsForRender] = useState<RenderRow[]>([]);
  const [isAccuracyHelpOpen, setIsAccuracyHelpOpen] = useState(false);
  const idleTaskRef = useRef<number | null>(null);

  const cancelScheduledTask = () => {
    if (idleTaskRef.current === null) {
      return;
    }
    if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
      (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(
        idleTaskRef.current,
      );
    } else {
      globalThis.clearTimeout(idleTaskRef.current);
    }
    idleTaskRef.current = null;
  };

  const providers = useMemo(
    () => Array.from(new Set(models.map((model) => model.provider))).sort(),
    [models],
  );

  useEffect(() => {
    if (selectedProvider !== "all" && !providers.includes(selectedProvider)) {
      setSelectedProvider("all");
    }
  }, [providers, selectedProvider]);

  const getSortableDate = (value: string | undefined, direction: SortDirection) => {
    if (!value) {
      return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    return parsed;
  };

  const filteredModels = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return models.filter((model) => {
      const matchesProvider =
        selectedProvider === "all" || model.provider === selectedProvider;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        model.provider.toLowerCase().includes(normalizedSearch) ||
        model.model.toLowerCase().includes(normalizedSearch);

      if (!matchesProvider || !matchesSearch) {
        return false;
      }

      if (textOnly && model.modality !== "text") {
        return false;
      }

      if (tieredOnly && !model.is_tiered) {
        return false;
      }

      if (exactOnly) {
        return model.tokenization === "exact";
      }

      return true;
    });
  }, [models, exactOnly, searchTerm, selectedProvider, textOnly, tieredOnly]);

  const sortedModels = useMemo(() => {
    const sorted = [...filteredModels];
    sorted.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "provider":
          return direction * a.provider.localeCompare(b.provider);
        case "model":
          return direction * a.model.localeCompare(b.model);
        case "release_date": {
          const aTime = getSortableDate(a.release_date, sortDirection);
          const bTime = getSortableDate(b.release_date, sortDirection);
          return direction * (aTime - bTime);
        }
        case "input":
          return direction * (a.input_per_mtok - b.input_per_mtok);
        case "output": {
          const aOutput =
            a.output_per_mtok ?? (sortDirection === "asc" ? Number.POSITIVE_INFINITY : -1);
          const bOutput =
            b.output_per_mtok ?? (sortDirection === "asc" ? Number.POSITIVE_INFINITY : -1);
          return direction * (aOutput - bOutput);
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredModels, sortDirection, sortKey]);

  const computedModels = useMemo(
    () =>
      computeMode === "primary-model" ? sortedModels.slice(0, 1) : sortedModels,
    [computeMode, sortedModels],
  );

  useEffect(() => {
    let cancelled = false;
    cancelScheduledTask();

    setRowsForRender([]);

    if (computedModels.length === 0) {
      setIsTokenizing(false);
      return () => {
        cancelled = true;
      };
    }

    setIsTokenizing(text.length > 0);
    const rows: RenderRow[] = [];
    let index = 0;
    const batchSize = text.length > 50_000 ? 6 : 8;

    const scheduleBatch = (callback: () => void) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleTaskRef.current = (window as Window & { requestIdleCallback: (cb: () => void) => number })
          .requestIdleCallback(callback);
        return;
      }
      idleTaskRef.current = globalThis.setTimeout(callback, 0);
    };

    const runBatch = () => {
      if (cancelled) {
        return;
      }
      const end = Math.min(index + batchSize, computedModels.length);
      for (; index < end; index += 1) {
        const model = computedModels[index];
        if (!model) {
          continue;
        }
        const tokenCount = getTokenCountForPricingRow(text, model);
        const exactness: "exact" | "estimated" = tokenCount.mode;

        if (exactOnly && exactness !== "exact") {
          continue;
        }

        const costs = computeCostUSD(tokenCount.tokens, tokenCount.tokens, model);

        rows.push({
          provider: model.provider,
          model: model.model,
          release_date: model.release_date,
          pricing_tier: model.pricing_tier,
          notes: model.notes,
          modality: model.modality,
          tokenization: model.tokenization,
          is_tiered: model.is_tiered,
          exactness,
          tokens: tokenCount.tokens,
          input_cost_usd: costs.inputCostUSD,
          output_cost_usd:
            model.output_per_mtok === undefined ? undefined : costs.outputCostUSD,
          total_cost_usd: costs.totalUSD,
          price_input_per_mtok: model.input_per_mtok,
          price_output_per_mtok: model.output_per_mtok,
        });
      }

      setRowsForRender([...rows]);

      if (end < computedModels.length) {
        scheduleBatch(runBatch);
      } else {
        setIsTokenizing(false);
      }
    };

    scheduleBatch(runBatch);

    return () => {
      cancelled = true;
      cancelScheduledTask();
    };
  }, [computedModels, exactOnly, text]);

  useEffect(() => {
    onVisibleRowsChange?.(rowsForRender);
  }, [onVisibleRowsChange, rowsForRender]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const getAriaSort = (key: SortKey) => {
    if (sortKey !== key) {
      return "none";
    }
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div className="app__table-section">
      <div className="app__table-controls">
        <label className="app__control">
          <span className="app__label">Provider</span>
          <select
            className="app__select"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value)}
          >
            <option value="all">All providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label className="app__control app__control--search">
          <span className="app__label">Search</span>
          <input
            className="app__input"
            type="search"
            placeholder="Search model or provider"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <Toggle
          id="text-only"
          checked={textOnly}
          onChange={(event) => setTextOnly(event.target.checked)}
          label="Text only"
          description="Hide audio/realtime entries"
        />
        <Toggle
          id="tiered-only"
          checked={tieredOnly}
          onChange={(event) => setTieredOnly(event.target.checked)}
          label="Tiered pricing"
          description="Only show tiered entries"
        />
        <Toggle
          id="exact-only"
          checked={exactOnly}
          onChange={(event) => setExactOnly(event.target.checked)}
          label="Exact tokenization available"
          description="Tokenizer-backed counts"
        />
      </div>
      <TableShell>
        <table
          className="app__table"
          aria-busy={isTokenizing}
          aria-live="polite"
        >
          <thead>
            <tr>
              <th aria-sort={getAriaSort("provider")}>
                <button
                  type="button"
                  className="app__table-sort"
                  onClick={() => handleSort("provider")}
                >
                  Provider
                  <span aria-hidden="true" className="app__table-sort-icon">
                    {sortKey === "provider"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th aria-sort={getAriaSort("model")}>
                <button
                  type="button"
                  className="app__table-sort"
                  onClick={() => handleSort("model")}
                >
                  Model
                  <span aria-hidden="true" className="app__table-sort-icon">
                    {sortKey === "model"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th aria-sort={getAriaSort("release_date")}>
                <button
                  type="button"
                  className="app__table-sort"
                  onClick={() => handleSort("release_date")}
                >
                  Release date
                  <span aria-hidden="true" className="app__table-sort-icon">
                    {sortKey === "release_date"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th aria-sort={getAriaSort("input")}>
                <button
                  type="button"
                  className="app__table-sort"
                  onClick={() => handleSort("input")}
                >
                  Input $/1M
                  <span aria-hidden="true" className="app__table-sort-icon">
                    {sortKey === "input"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th aria-sort={getAriaSort("output")}>
                <button
                  type="button"
                  className="app__table-sort"
                  onClick={() => handleSort("output")}
                >
                  Output $/1M
                  <span aria-hidden="true" className="app__table-sort-icon">
                    {sortKey === "output"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              </th>
              <th>
                <div className="app__table-help">
                  <span>Count type</span>
                  <Popover
                    isOpen={isAccuracyHelpOpen}
                    panelLabel="Token accuracy help"
                    align="end"
                    trigger={
                      <button
                        type="button"
                        className="app__help-button"
                        aria-haspopup="dialog"
                        aria-expanded={isAccuracyHelpOpen}
                        onClick={() =>
                          setIsAccuracyHelpOpen((prev) => !prev)
                        }
                      >
                        ?
                      </button>
                    }
                  >
                    <div className="app__help-panel">
                      <strong>Accuracy policy</strong>
                      <p>
                        Exact uses tokenizer-backed counts for OpenAI models. Estimated appears when
                        exact local tokenizers are unavailable for that provider.
                      </p>
                    </div>
                  </Popover>
                </div>
              </th>
              <th className="app__cell--numeric">Tokens</th>
              <th className="app__cell--numeric">Cost</th>
            </tr>
          </thead>
          <tbody>
            {isTokenizing ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="app__skeleton-row">
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <td key={`skeleton-${index}-${cellIndex}`}>
                      <span className="app__skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rowsForRender.length === 0 ? (
              <tr>
                <td colSpan={8} className="app__empty">
                  {text.trim().length === 0
                    ? "Add text or choose a preset to compute token and cost results."
                    : "No models match your filters. Clear search or toggles to see more rows."}
                </td>
              </tr>
            ) : (
              rowsForRender.flatMap((row, index) => {
                const tooltipText =
                  row.exactness === "exact"
                    ? "Exact means tokenizer-based token count is used."
                    : "This model uses an estimate because exact tokenization data isn’t available locally. Real counts may differ.";

                const rows: JSX.Element[] = [];
                const shouldGroup =
                  sortKey === "provider" &&
                  (index === 0 || row.provider !== rowsForRender[index - 1]?.provider);

                if (shouldGroup) {
                  rows.push(
                    <tr key={`${row.provider}-group`} className="app__table-group">
                      <td colSpan={8}>
                        <strong>{row.provider}</strong>
                      </td>
                    </tr>,
                  );
                }

                const modelLabel = (
                  <div className="app__model-cell">
                    <span>{row.model}</span>
                    {row.pricing_tier ? (
                      <Badge tone="neutral">{row.pricing_tier}</Badge>
                    ) : null}
                  </div>
                );

                rows.push(
                  <tr key={`${row.provider}-${row.model}-${row.pricing_tier ?? "base"}`}>
                    <td>{row.provider}</td>
                    <td>
                      {row.notes ? (
                        <Tooltip content={row.notes}>{modelLabel}</Tooltip>
                      ) : (
                        modelLabel
                      )}
                    </td>
                    <td>{row.release_date ?? "—"}</td>
                    <td className="app__cell--numeric">
                      ${row.price_input_per_mtok.toFixed(2)}
                    </td>
                    <td className="app__cell--numeric">
                      {row.price_output_per_mtok === undefined
                        ? "—"
                        : `$${row.price_output_per_mtok.toFixed(2)}`}
                    </td>
                    <td>
                      <Tooltip content={tooltipText}>
                        <Badge
                          tone={row.exactness === "exact" ? "success" : "warning"}
                        >
                          {row.exactness === "exact" ? "Exact" : "Estimated"}
                        </Badge>
                      </Tooltip>
                    </td>
                    <td className="app__cell--numeric">
                      {Number.isFinite(row.tokens)
                        ? row.tokens.toLocaleString()
                        : "—"}
                    </td>
                    <td className="app__cell--numeric">
                      <div className="app__cost">
                        <span>{formatUSD(row.total_cost_usd)}</span>
                        <span className="app__muted">
                          In {formatUSD(row.input_cost_usd)} / Out{" "}
                          {row.output_cost_usd === undefined
                            ? "—"
                            : formatUSD(row.output_cost_usd)}
                        </span>
                      </div>
                    </td>
                  </tr>,
                );

                return rows;
              })
            )}
          </tbody>
        </table>
      </TableShell>
      <p className="app__note">
        {computeMode === "primary-model"
          ? "Primary model mode is enabled: only the top visible row is computed."
          : "Visible rows mode computes rows after filters/search; exact uses tokenizer-backed counts, estimated appears when local tokenizer data is unavailable."}
      </p>
    </div>
  );
};

export default PricingTable;
