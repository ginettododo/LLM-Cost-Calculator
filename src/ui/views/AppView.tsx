import { useEffect, useMemo, useState } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
} from "../../core/counters";
import { computeCostUSD, toModelId } from "../../core";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import PricingTable from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import useDebouncedValue from "../state/useDebouncedValue";
import useTokenCounts from "../state/useTokenCounts";

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [primaryModelId, setPrimaryModelId] = useState("");
  const debouncedText = useDebouncedValue(text, 160);

  const counters = useMemo(() => {
    const characters = countCharacters(debouncedText);
    const words = countWords(debouncedText);
    const lines = countLines(debouncedText);
    const bytes = countBytesUtf8(debouncedText);

    return { characters, words, lines, bytes };
  }, [debouncedText]);

  const modelOptions = useMemo(
    () =>
      prices.models.map((model) => ({
        id: toModelId(model.provider, model.model),
        label: `${model.provider} ${model.model}`,
      })),
    [prices.models],
  );

  useEffect(() => {
    if (!primaryModelId && modelOptions.length > 0) {
      setPrimaryModelId(modelOptions[0]?.id ?? "");
    }
  }, [modelOptions, primaryModelId]);

  const primaryModel = useMemo(
    () =>
      prices.models.find(
        (model) => toModelId(model.provider, model.model) === primaryModelId,
      ),
    [primaryModelId, prices.models],
  );

  const { counts: primaryCounts } = useTokenCounts({
    text: debouncedText,
    modelIds: primaryModelId ? [primaryModelId] : [],
  });

  const primaryCountState = primaryModelId
    ? primaryCounts[primaryModelId]
    : undefined;
  const primaryTokens = primaryCountState?.result?.tokens ?? 0;
  const primaryExactness = primaryCountState?.result?.exactness;
  const primaryCost = primaryModel
    ? computeCostUSD(primaryTokens, primaryTokens, primaryModel)
    : null;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Token &amp; LLM Cost Calculator</h1>
        <p className="app__subtitle">
          All calculations run locally in your browser with exact OpenAI token
          counts and estimated counts elsewhere.
        </p>
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
          />
        </section>

        <section className="app__panel app__panel--grid">
          <div className="app__card">
            <div className="app__card-header">
              <h2>Primary model summary</h2>
            </div>
            <label className="app__control app__control--full">
              <span className="app__label">Primary model</span>
              <select
                className="app__select"
                value={primaryModelId}
                onChange={(event) => setPrimaryModelId(event.target.value)}
              >
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="app__token-placeholder">
              <span className="app__token-value">
                Tokens:{" "}
                {primaryCountState?.status === "loading"
                  ? "…"
                  : primaryTokens.toLocaleString()}
              </span>
              <span
                className={`app__badge ${
                  primaryExactness === "exact"
                    ? "app__badge--exact"
                    : primaryExactness === "estimated"
                      ? "app__badge--estimated"
                      : "app__badge--loading"
                }`}
              >
                {primaryExactness === "exact"
                  ? "Exact"
                  : primaryExactness === "estimated"
                    ? "Estimated"
                    : "Loading"}
              </span>
            </div>
            <div className="app__summary-grid">
              <div>
                <span className="app__label">Total cost</span>
                <div className="app__summary-value">
                  {primaryCost && primaryCountState?.status === "ready"
                    ? `$${primaryCost.totalUSD.toFixed(4)}`
                    : "—"}
                </div>
              </div>
              <div>
                <span className="app__label">In / Out</span>
                <div className="app__summary-value app__summary-value--muted">
                  {primaryCost && primaryCountState?.status === "ready"
                    ? `$${primaryCost.inputCostUSD.toFixed(4)} / $${primaryCost.outputCostUSD.toFixed(4)}`
                    : "—"}
                </div>
              </div>
            </div>
            <p className="app__hint app__hint--tight">
              Exact counts for OpenAI models; others use a char/4 estimate.
            </p>
          </div>
          <CountersPanel counters={counters} />
        </section>

        <section className="app__panel">
          <div className="app__card">
            <h2>Pricing Table</h2>
            <p className="app__muted">
              Pricing data last updated: {prices.retrieved_at}
            </p>
            <PricingTable models={prices.models} text={debouncedText} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppView;
