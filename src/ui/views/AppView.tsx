import { useMemo, useState } from "react";
import prices from "../../data/prices.json";
import CountersPanel from "../components/CountersPanel";
import PricingTable from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";

const AppView = () => {
  const [text, setText] = useState("");

  const counters = useMemo(() => {
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r?\n/).length : 0;
    const bytes = new TextEncoder().encode(text).length;

    return { characters, words, lines, bytes };
  }, [text]);

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
          <TextareaPanel value={text} onChange={setText} />
        </section>

        <section className="app__panel app__panel--grid">
          <div className="app__card">
            <h2>Token Estimate</h2>
            <div className="app__token-placeholder">
              <span className="app__token-value">Tokens: TBD</span>
              <span className="app__token-badge">Estimated</span>
            </div>
          </div>
          <CountersPanel counters={counters} />
        </section>

        <section className="app__panel">
          <div className="app__card">
            <h2>Pricing Table</h2>
            <p className="app__muted">
              Pricing data last updated: {prices.retrieved_at}
            </p>
            <PricingTable models={prices.models} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppView;
