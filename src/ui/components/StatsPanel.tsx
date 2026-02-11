import { useMemo } from "react";
import { computeCostUSD, formatUSD } from "../../core";
import { PricingRow } from "../../core/types/pricing";
import { TokenStats } from "../state/useTokenStats";
import Badge from "./ui/Badge";
import Card from "./ui/Card";
import Button from "./ui/Button";

type StatsPanelProps = {
  text: string;
  stats: TokenStats | null;
  selectedModelId: string;
  models: PricingRow[];
  onModelChange: (modelId: string) => void;
  characterCount: number;
  wordCount: number;
  onCopySummary: () => void;
  onExport: () => void;
  outputMode: "ratio" | "fixed";
  outputValue: number;
  onOutputModeChange: (mode: "ratio" | "fixed") => void;
  onOutputValueChange: (val: number) => void;
};

const StatsPanel = ({
  stats,
  selectedModelId,
  models,
  onModelChange,
  characterCount,
  wordCount,
  onCopySummary,
  onExport,
  outputMode,
  outputValue,
  onOutputModeChange,
  onOutputValueChange,
}: StatsPanelProps) => {

  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
  }, [models]);

  return (
    <div className="app__stats-panel">
      <Card variant="default" className="app__stats-card-sticky">
        <div className="app__stats-header">
          <label className="app__label-large">Model</label>
          <select
            className="app__select-large"
            value={selectedModelId}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="" disabled>Select a model</option>
            {sortedModels.map((row) => (
              <option
                key={`${row.provider}::${row.model}`}
                value={`${row.provider}::${row.model}`}
              >
                {row.provider} / {row.model}
              </option>
            ))}
          </select>
        </div>

        <div className="app__big-stats-col">
          <div className="app__big-stat-item">
            <span className="app__label-stat">Estimated Cost</span>
            <span className="app__value-stat app__value-stat--cost">
              {stats ? formatUSD(stats.totalCostUSD) : "$0.00"}
            </span>
          </div>

          <div className="app__big-stat-item">
            <div className="app__label-row">
              <span className="app__label-stat">Token Count</span>
              {stats?.exactness === "exact" && <Badge tone="success">EXACT</Badge>}
              {stats?.exactness === "estimated" && <Badge tone="warning">ESTIMATED</Badge>}
            </div>
            <span className="app__value-stat">
              {stats ? stats.tokens.toLocaleString() : "0"}
            </span>
          </div>
        </div>

        <div className="app__stats-grid">
          <div className="app__stat-mini">
            <span className="app__label-mini">Characters</span>
            <span className="app__value-mini">{characterCount.toLocaleString()}</span>
          </div>
          <div className="app__stat-mini">
            <span className="app__label-mini">Words</span>
            <span className="app__value-mini">{wordCount.toLocaleString()}</span>
          </div>
        </div>

        {stats && (
          <div className="app__cost-breakdown">
            <div className="app__breakdown-row">
              <span>Input Cost</span>
              <span>{formatUSD(stats.inputCostUSD)}</span>
            </div>
            <div className="app__breakdown-row">
              <span>Output Cost (0%)</span>
              <span>{formatUSD(stats.outputCostUSD)}</span>
            </div>
          </div>
        )}

        <div className="app__stats-settings">
          <div className="app__label-row">
            <span className="app__label-mini">Output Tokens</span>
            <div className="app__toggle-group">
              <button
                type="button"
                className={`app__toggle-btn ${outputMode === "ratio" ? "active" : ""}`}
                onClick={() => onOutputModeChange("ratio")}
              >Ratio</button>
              <button
                type="button"
                className={`app__toggle-btn ${outputMode === "fixed" ? "active" : ""}`}
                onClick={() => onOutputModeChange("fixed")}
              >Fixed</button>
            </div>
          </div>
          <div className="app__input-row">
            <input
              type="number"
              className="app__input-mini"
              value={outputValue}
              onChange={(e) => onOutputValueChange(parseFloat(e.target.value) || 0)}
              step={outputMode === "ratio" ? 0.1 : 1}
              min={0}
            />
            <span className="app__unit-label">
              {outputMode === "ratio" ? "x Input" : "Tokens"}
            </span>
          </div>
        </div>

        <div className="app__stats-actions">
          <Button variant="subtle" onClick={onCopySummary} className="u-full-width">
            Copy Summary
          </Button>
          <Button variant="ghost" onClick={onExport} className="u-full-width">
            Export Report
          </Button>
        </div>

        <div className="app__quick-compare">
          <span className="app__compare-title">Quick Comparison</span>
          <div className="app__compare-list">
            {sortedModels
              .filter(m => `${m.provider}::${m.model}` !== selectedModelId)
              .slice(0, 8)
              .map(model => {
                return (
                  <div key={`${model.provider}::${model.model}`} className="app__compare-row">
                    <div className="app__compare-model">
                      <Badge tone="neutral">{model.provider}</Badge>
                      <span className="app__compare-name">{model.model}</span>
                    </div>
                    <span className="app__compare-cost">
                      {stats ? formatUSD(computeCostUSD(stats.tokens, stats.tokens, model).totalUSD) : "$0.00"}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>

      <div className="app__disclaimer">
        <p>
          {stats?.exactness === 'exact'
            ? "Token count is exact using a tokenizer."
            : "Token count is estimated using character heuristics."}
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;
