import { useEffect, useMemo, useState } from "react";
import { computeCostUSD, getTokenCountForPricingRow } from "../../core";
import type { PricingRow } from "../../core/types/pricing";

type PricingTableProps = {
  models: PricingRow[];
  text: string;
  computeMode: ComputeMode;
  onVisibleRowsChange?: (rows: VisiblePricingRow[]) => void;
};

type SortKey = "provider" | "model" | "release_date" | "input" | "output";
type SortDirection = "asc" | "desc";
export type ComputeMode = "all-models" | "primary-model";

type RenderRow = VisiblePricingRow & {
  release_date?: string;
};

export type VisiblePricingRow = {
  provider: string;
  model: string;
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
  const [sortKey, setSortKey] = useState<SortKey>("provider");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const providers = useMemo(
    () => Array.from(new Set(models.map((model) => model.provider))).sort(),
    [models],
  );

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

      if (!exactOnly) {
        return true;
      }

      return model.provider.trim().toLowerCase() === "openai";
    });
  }, [models, exactOnly, searchTerm, selectedProvider]);

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
          const aTime = a.release_date ? Date.parse(a.release_date) : 0;
          const bTime = b.release_date ? Date.parse(b.release_date) : 0;
          return direction * (aTime - bTime);
        }
        case "input":
          return direction * (a.input_per_mtok - b.input_per_mtok);
        case "output": {
          const aOutput = a.output_per_mtok ?? 0;
          const bOutput = b.output_per_mtok ?? 0;
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

  const rowsForRender = useMemo<RenderRow[]>(() => {
    const rows: RenderRow[] = [];

    computedModels.forEach((model) => {
      const tokenCount = getTokenCountForPricingRow(text, model);
      const exactness: "exact" | "estimated" = tokenCount.mode;

      if (exactOnly && exactness !== "exact") {
        return;
      }

      const costs = computeCostUSD(tokenCount.tokens, tokenCount.tokens, model);

      rows.push({
        provider: model.provider,
        model: model.model,
        release_date: model.release_date,
        exactness,
        tokens: tokenCount.tokens,
        input_cost_usd: costs.inputCostUSD,
        output_cost_usd:
          model.output_per_mtok === undefined ? undefined : costs.outputCostUSD,
        total_cost_usd: costs.totalUSD,
        price_input_per_mtok: model.input_per_mtok,
        price_output_per_mtok: model.output_per_mtok,
      });
    });

    return rows;
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
        <label className="app__toggle app__toggle--inline">
          <input
            type="checkbox"
            checked={exactOnly}
            onChange={(event) => setExactOnly(event.target.checked)}
          />
          <span>Exact only</span>
        </label>
      </div>
      <div className="app__table-wrapper">
        <table className="app__table">
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
              <th>Count type</th>
              <th>Tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {rowsForRender.length === 0 ? (
              <tr>
                <td colSpan={8} className="app__empty">
                  No models match the current filters.
                </td>
              </tr>
            ) : (
              rowsForRender.map((row, index) => {
                const tooltipId = `count-type-tooltip-${index}`;
                const tooltipText =
                  row.exactness === "exact"
                    ? "Exact means tokenizer-based token count is used."
                    : "Estimated means token count is approximated using characters/4.";

                return (
                  <tr key={`${row.provider}-${row.model}`}>
                    <td>{row.provider}</td>
                    <td>{row.model}</td>
                    <td>{row.release_date ?? "—"}</td>
                    <td>${row.price_input_per_mtok.toFixed(2)}</td>
                    <td>
                      {row.price_output_per_mtok === undefined
                        ? "—"
                        : `$${row.price_output_per_mtok.toFixed(2)}`}
                    </td>
                    <td>
                      <span className="app__tooltip-wrapper">
                        <span
                          className={`app__badge ${
                            row.exactness === "exact"
                              ? "app__badge--exact"
                              : "app__badge--estimated"
                          }`}
                          tabIndex={0}
                          aria-describedby={tooltipId}
                        >
                          {row.exactness === "exact" ? "Exact" : "Estimated"}
                        </span>
                        <span role="tooltip" id={tooltipId} className="app__tooltip">
                          {tooltipText}
                        </span>
                      </span>
                    </td>
                    <td>{row.tokens.toLocaleString()}</td>
                    <td>
                      <div className="app__cost">
                        <span>${row.total_cost_usd.toFixed(4)}</span>
                        <span className="app__muted">
                          In {row.input_cost_usd.toFixed(4)} / Out{" "}
                          {row.output_cost_usd?.toFixed(4) ?? "0.0000"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="app__note">
        {computeMode === "primary-model"
          ? "Primary model mode is enabled: only the top filtered model is computed."
          : "Exact tokenization is used for OpenAI models; other providers use char/4 estimation."}
      </p>
    </div>
  );
};

export default PricingTable;
