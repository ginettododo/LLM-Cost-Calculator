import { useMemo, useState } from "react";
import {
  countBytesUtf8,
  countCharacters,
  countLines,
  countWords,
} from "../../core/counters";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import PricingTable from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import useDebouncedValue from "../state/useDebouncedValue";

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const debouncedText = useDebouncedValue(text, 160);

  const counters = useMemo(() => {
    const characters = countCharacters(debouncedText);
    const words = countWords(debouncedText);
    const lines = countLines(debouncedText);
    const bytes = countBytesUtf8(debouncedText);

    return { characters, words, lines, bytes };
  }, [debouncedText]);

  const estimatedTokens = useMemo(() => {
    if (!counters.characters) {
      return 0;
    }
    return Math.ceil(counters.characters / 4);
  }, [counters.characters]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Token &amp; LLM Cost Calculator</h1>
        <p className="app__subtitle">
          All calculations run locally in your browser. Tokenization is coming soon.
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
            <h2>Token Estimate</h2>
            <div className="app__token-placeholder">
              <span className="app__token-value">
                Tokens: {estimatedTokens.toLocaleString()}
              </span>
              <span className="app__token-badge">Estimated</span>
            </div>
            <p className="app__hint app__hint--tight">
              Token estimate uses char/4 until exact tokenizer is enabled.
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
            <PricingTable models={prices.models} tokenEstimate={estimatedTokens} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppView;
