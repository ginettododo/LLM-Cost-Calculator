import { useMemo, useState } from "react";
import { computeCostUSD, getProviderExactness, toModelId } from "../../core";
import type { PricingRow } from "../../core/types/pricing";
import useTokenCounts from "../state/useTokenCounts";

type PricingTableProps = {
  models: PricingRow[];
  text: string;
};

type SortKey = "provider" | "model" | "release_date" | "input" | "output";
type SortDirection = "asc" | "desc";

const PricingTable = ({ models, text }: PricingTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [exactOnly, setExactOnly] = useState(false);
  const [visibleOnly, setVisibleOnly] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("provider");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const providers = useMemo(
    () => Array.from(new Set(models.map((model) => model.provider))).sort(),
    [models],
  );

  const filteredModels = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return models.filter((model) => {
      const modelId = toModelId(model.provider, model.model);
      const matchesProvider =
        selectedProvider === "all" || model.provider === selectedProvider;
      const countType = getProviderExactness(modelId);
      const matchesExact = !exactOnly || countType === "exact";
      const matchesSearch =
        normalizedSearch.length === 0 ||
        model.provider.toLowerCase().includes(normalizedSearch) ||
        model.model.toLowerCase().includes(normalizedSearch);

      return matchesProvider && matchesExact && matchesSearch;
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

  const visibleModelIds = useMemo(
    () => sortedModels.map((model) => toModelId(model.provider, model.model)),
    [sortedModels],
  );
  const allModelIds = useMemo(
    () => models.map((model) => toModelId(model.provider, model.model)),
    [models],
  );

  const { counts } = useTokenCounts({
    text,
    modelIds: visibleOnly ? visibleModelIds : allModelIds,
  });

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
        <label className="app__toggle app__toggle--inline">
          <input
            type="checkbox"
            checked={visibleOnly}
            onChange={(event) => setVisibleOnly(event.target.checked)}
          />
          <span>Compute for visible rows only</span>
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
            {sortedModels.length === 0 ? (
              <tr>
                <td colSpan={8} className="app__empty">
                  No models match the current filters.
                </td>
              </tr>
            ) : (
              sortedModels.map((model, index) => {
                const modelId = toModelId(model.provider, model.model);
                const countState = counts[modelId];
                const countType = countState?.result?.exactness;
                const tooltipId = `count-type-tooltip-${index}`;
                const tokens = countState?.result?.tokens ?? 0;
                const isLoading = countState?.status === "loading";
                const costs =
                  countState?.status === "ready"
                    ? computeCostUSD(tokens, tokens, model)
                    : null;

                return (
                  <tr key={`${model.provider}-${model.model}`}>
                    <td>{model.provider}</td>
                    <td>{model.model}</td>
                    <td>{model.release_date ?? "—"}</td>
                    <td>${model.input_per_mtok.toFixed(2)}</td>
                    <td>
                      {model.output_per_mtok
                        ? `$${model.output_per_mtok.toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      <span className="app__tooltip-wrapper">
                        <span
                          className={`app__badge ${
                            countType === "exact"
                              ? "app__badge--exact"
                              : countType === "estimated"
                                ? "app__badge--estimated"
                                : "app__badge--loading"
                          }`}
                          tabIndex={0}
                          aria-describedby={
                            countType === "estimated" ? tooltipId : undefined
                          }
                        >
                          {countType === "exact"
                            ? "Exact"
                            : countType === "estimated"
                              ? "Estimated"
                              : "Loading"}
                        </span>
                        {countType === "estimated" ? (
                          <span
                            role="tooltip"
                            id={tooltipId}
                            className="app__tooltip"
                          >
                            {countState?.result?.notes ??
                              "Estimated tokenizer; costs will be approximate."}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="app__token-cell">
                      {isLoading ? "…" : tokens.toLocaleString()}
                    </td>
                    <td>
                      {costs ? (
                        <div className="app__cost">
                          <span>${costs.totalUSD.toFixed(4)}</span>
                          <span className="app__muted">
                            In {costs.inputCostUSD.toFixed(4)} / Out{" "}
                            {costs.outputCostUSD.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="app__muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="app__note">
        OpenAI models use exact local tokenization; other providers use a char/4
        estimate until their exact tokenizers land.
      </p>
    </div>
  );
};

export default PricingTable;
