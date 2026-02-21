import { useEffect, useMemo, useState } from "react";
import { computeCostUSD, formatUSD, getTokenCountForPricingRow } from "../../core";
import type { PricingRow } from "../../core/types/pricing";
import {
  TableShell,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input,
  Select,
  Toggle,
  Tooltip,
} from "./base";

type PricingTableProps = {
  models: PricingRow[];
  text: string;
  computeMode: ComputeMode;
  onVisibleRowsChange?: (rows: VisiblePricingRow[]) => void;
  selectedModelKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
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

export const rowKey = (row: { provider: string; model: string }) =>
  `${row.provider}::${row.model}`;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "release_date", label: "Data di uscita" },
  { value: "provider", label: "Provider" },
  { value: "model", label: "Modello" },
  { value: "input", label: "Prezzo input" },
  { value: "output", label: "Prezzo output" },
];

const PricingTable = ({
  models,
  text,
  computeMode,
  onVisibleRowsChange,
  selectedModelKeys,
  onSelectionChange,
}: PricingTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [exactOnly, setExactOnly] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [tieredOnly, setTieredOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("release_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [rowsForRender, setRowsForRender] = useState<RenderRow[]>([]);

  const hasSelection = onSelectionChange !== undefined;
  const selectedKeys = selectedModelKeys ?? new Set<string>();

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
    () => (computeMode === "primary-model" ? sortedModels.slice(0, 1) : sortedModels),
    [computeMode, sortedModels],
  );

  useEffect(() => {
    let cancelled = false;
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
    const batchSize = text.length > 50_000 ? 8 : 24;

    const scheduleBatch = (callback: () => void) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        return (window as Window & { requestIdleCallback: (cb: () => void) => number })
          .requestIdleCallback(callback);
      }

      return globalThis.setTimeout(callback, 0);
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
    setSortDirection(key === "release_date" ? "desc" : "asc");
  };

  const handleToggleRow = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else if (next.size < 4) {
      next.add(key);
    }
    onSelectionChange(next);
  };

  const handleClearSelection = () => {
    onSelectionChange?.(new Set());
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
    <span style={{ marginLeft: "2px", display: "inline-flex", verticalAlign: "middle", opacity: active ? 1 : 0.3 }}>
      {active ? (
        direction === "asc" ? (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5l7 14H5l7-14z" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 19l-7-14h14l-7 14z" />
          </svg>
        )
      ) : (
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5l5 9H7l5-9z" opacity="0.5" />
          <path d="M12 19l-5-9h10l-5 9z" opacity="0.5" />
        </svg>
      )}
    </span>
  );

  const activeFiltersCount = [
    textOnly,
    tieredOnly,
    exactOnly,
    selectedProvider !== "all",
    searchTerm.trim().length > 0,
  ].filter(Boolean).length;

  const colCount = hasSelection ? 7 : 6;
  const hasText = text.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "flex-end",
          padding: "8px 10px",
          backgroundColor: "var(--color-bg-subtle)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <div style={{ flex: "0 0 140px" }}>
          <Select
            label="Provider"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value)}
          >
            <option value="all">Tutti</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ flex: "0 0 150px" }}>
          <Select
            label="Ordina per"
            value={`${sortKey}:${sortDirection}`}
            onChange={(event) => {
              const [key, dir] = event.target.value.split(":") as [SortKey, SortDirection];
              setSortKey(key);
              setSortDirection(dir);
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <optgroup key={opt.value} label={opt.label}>
                <option value={`${opt.value}:${opt.value === "release_date" ? "desc" : "asc"}`}>
                  {opt.value === "release_date" ? "Più recenti" : opt.value === "input" || opt.value === "output" ? "Più economici" : "A → Z"}
                </option>
                <option value={`${opt.value}:${opt.value === "release_date" ? "asc" : "desc"}`}>
                  {opt.value === "release_date" ? "Più vecchi" : opt.value === "input" || opt.value === "output" ? "Più costosi" : "Z → A"}
                </option>
              </optgroup>
            ))}
          </Select>
        </div>

        <div style={{ flex: "1 1 130px", minWidth: "110px" }}>
          <Input
            label="Cerca"
            type="search"
            placeholder="Cerca…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", paddingBottom: "4px", alignItems: "center" }}>
          <Toggle label="Solo testo" checked={textOnly} onChange={setTextOnly} />
          <Toggle label="Solo esatti" checked={exactOnly} onChange={setExactOnly} />
        </div>

        {activeFiltersCount > 0 && (
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                backgroundColor: "var(--color-primary-base)",
                color: "#fff",
                borderRadius: "var(--radius-full)",
                padding: "1px 7px",
                fontWeight: 600,
              }}
            >
              {activeFiltersCount}
            </span>
          </div>
        )}

        {hasSelection && selectedKeys.size > 0 && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingBottom: "4px",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {selectedKeys.size}/4
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-tertiary)",
                cursor: "pointer",
                fontSize: "10px",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              reset
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <TableShell>
        <TableHeader>
          <TableRow>
            {hasSelection && (
              <TableHead style={{ width: "32px", padding: "6px 6px 6px 10px" }} />
            )}
            <TableHead onClick={() => handleSort("provider")} style={{ cursor: "pointer" }}>
              Provider <SortIcon active={sortKey === "provider"} direction={sortDirection} />
            </TableHead>
            <TableHead onClick={() => handleSort("model")} style={{ cursor: "pointer" }}>
              Modello <SortIcon active={sortKey === "model"} direction={sortDirection} />
            </TableHead>
            <TableHead onClick={() => handleSort("release_date")} style={{ cursor: "pointer" }}>
              Uscita <SortIcon active={sortKey === "release_date"} direction={sortDirection} />
            </TableHead>
            <TableHead align="right" onClick={() => handleSort("input")} style={{ cursor: "pointer" }}>
              $/1M in <SortIcon active={sortKey === "input"} direction={sortDirection} />
            </TableHead>
            <TableHead align="right" onClick={() => handleSort("output")} style={{ cursor: "pointer" }}>
              $/1M out <SortIcon active={sortKey === "output"} direction={sortDirection} />
            </TableHead>
            {hasText && (
              <TableHead align="right">Costo</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <tbody>
          {isTokenizing && rowsForRender.length === 0 ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} isZebra={rowIndex % 2 === 1}>
                {Array.from({ length: colCount }).map((_, cellIndex) => (
                  <TableCell key={`skeleton-${rowIndex}-${cellIndex}`}>
                    <div
                      className="shimmer-loading"
                      style={{
                        height: "10px",
                        borderRadius: "999px",
                        width: cellIndex === 2 ? "70%" : cellIndex === 1 ? "50%" : "40%",
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rowsForRender.length === 0 ? (
            <TableRow>
              <TableCell
                align="center"
                colSpan={colCount}
                style={{ padding: "28px 16px", color: "var(--color-text-secondary)" }}
              >
                <span style={{ fontSize: "12px" }}>Nessun modello corrisponde ai filtri</span>
              </TableCell>
            </TableRow>
          ) : (
            rowsForRender.map((row, index) => {
              const key = rowKey(row);
              const isSelected = selectedKeys.has(key);
              const isDisabled = hasSelection && !isSelected && selectedKeys.size >= 4;

              return (
                <TableRow
                  key={`${row.provider}-${row.model}-${row.pricing_tier ?? "base"}`}
                  isZebra={index % 2 === 1}
                  isSelected={isSelected}
                >
                  {hasSelection && (
                    <TableCell style={{ padding: "6px 6px 6px 10px", width: "32px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggleRow(key)}
                        style={{
                          width: "14px",
                          height: "14px",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          accentColor: "var(--color-primary-base)",
                          opacity: isDisabled ? 0.35 : 1,
                        }}
                        aria-label={`Seleziona ${row.provider} ${row.model}`}
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <span style={{ fontWeight: 500, fontSize: "12px" }}>{row.provider}</span>
                  </TableCell>

                  <TableCell>
                    <span style={{ fontWeight: 500, fontSize: "12px" }}>{row.model}</span>
                  </TableCell>

                  <TableCell style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>
                    {row.release_date ?? "—"}
                  </TableCell>

                  <TableCell align="right" mono>
                    ${row.price_input_per_mtok.toFixed(2)}
                  </TableCell>

                  <TableCell align="right" mono>
                    {row.price_output_per_mtok === undefined
                      ? "—"
                      : `$${row.price_output_per_mtok.toFixed(2)}`}
                  </TableCell>

                  {hasText && (
                    <TableCell align="right" mono>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>{formatUSD(row.total_cost_usd)}</span>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </tbody>
      </TableShell>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <p style={{ fontSize: "10px", color: "var(--color-text-tertiary)", margin: 0 }}>
          {rowsForRender.length} modelli
          {isTokenizing && (
            <span style={{ marginLeft: "6px" }}>
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{ animation: "spin 0.8s linear infinite", verticalAlign: "middle" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default PricingTable;
