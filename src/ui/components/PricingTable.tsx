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
    setSortDirection("asc");
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
    <span style={{ marginLeft: "4px", fontSize: "10px", opacity: active ? 1 : 0.35 }}>
      {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
        <div style={{ width: "200px" }}>
          <Select
            label="Provider"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value)}
          >
            <option value="all">All providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <Input
            label="Search"
            type="search"
            placeholder="Search model or provider..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
          <Toggle label="Text only" checked={textOnly} onChange={setTextOnly} />
          <Toggle label="Tiered only" checked={tieredOnly} onChange={setTieredOnly} />
          <Toggle label="Exact only" checked={exactOnly} onChange={setExactOnly} />
        </div>
      </div>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("provider")} style={{ cursor: "pointer" }}>
              Provider <SortIcon active={sortKey === "provider"} direction={sortDirection} />
            </TableHead>
            <TableHead onClick={() => handleSort("model")} style={{ cursor: "pointer" }}>
              Model <SortIcon active={sortKey === "model"} direction={sortDirection} />
            </TableHead>
            <TableHead onClick={() => handleSort("release_date")} style={{ cursor: "pointer" }}>
              Release <SortIcon active={sortKey === "release_date"} direction={sortDirection} />
            </TableHead>
            <TableHead align="right" onClick={() => handleSort("input")} style={{ cursor: "pointer" }}>
              Input $/1M <SortIcon active={sortKey === "input"} direction={sortDirection} />
            </TableHead>
            <TableHead align="right" onClick={() => handleSort("output")} style={{ cursor: "pointer" }}>
              Output $/1M <SortIcon active={sortKey === "output"} direction={sortDirection} />
            </TableHead>
            <TableHead align="center">Type</TableHead>
            <TableHead align="right">Tokens</TableHead>
            <TableHead align="right">Est. Cost</TableHead>
          </TableRow>
        </TableHeader>

        <tbody>
          {isTokenizing && rowsForRender.length === 0 ? (
            Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} isZebra={rowIndex % 2 === 1}>
                {Array.from({ length: 8 }).map((_, cellIndex) => (
                  <TableCell key={`skeleton-${rowIndex}-${cellIndex}`}>
                    <div
                      style={{
                        height: "10px",
                        borderRadius: "999px",
                        backgroundColor: "var(--color-bg-subtle)",
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
                colSpan={8}
                style={{ padding: "32px", color: "var(--color-text-secondary)" }}
              >
                No models match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            rowsForRender.map((row, index) => {
              const isExact = row.exactness === "exact";
              const tooltipText = isExact
                ? "Exact means tokenizer-based token count is used."
                : "Estimated means token count is approximated using characters/4.";

              return (
                <TableRow key={`${row.provider}-${row.model}-${row.pricing_tier ?? "base"}`} isZebra={index % 2 === 1}>
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontWeight: 500 }}>{row.provider}</span>
                      {row.pricing_tier ? (
                        <Badge variant="neutral">{row.pricing_tier}</Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 500 }}>{row.model}</span>
                      {row.is_tiered ? <Badge variant="neutral">Tiered</Badge> : null}
                    </div>
                  </TableCell>

                  <TableCell style={{ color: "var(--color-text-secondary)" }}>
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

                  <TableCell align="center">
                    <Tooltip content={tooltipText}>
                      <Badge variant={isExact ? "exact" : "estimated"}>
                        {isExact ? "Exact" : "Est."}
                      </Badge>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="right" mono>
                    {Number.isFinite(row.tokens) ? row.tokens.toLocaleString() : "—"}
                  </TableCell>

                  <TableCell align="right" mono>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontWeight: 600 }}>{formatUSD(row.total_cost_usd)}</span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                        In {formatUSD(row.input_cost_usd)} / Out{" "}
                        {row.output_cost_usd === undefined ? "—" : formatUSD(row.output_cost_usd)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </TableShell>

      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
        {computeMode === "primary-model"
          ? "Primary model mode is enabled: only the top visible row is computed."
          : "Visible rows mode computes rows after filters and search; exact uses tokenizers, estimated uses a character heuristic."}
      </p>
    </div>
  );
};

export default PricingTable;
