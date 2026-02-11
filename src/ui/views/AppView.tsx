import { useMemo, useState } from "react";
import { countCharacters, countWords } from "../../core/counters";
import { validatePrices } from "../../core";
import prices from "../../data/prices.json";
import PricingTable from "../components/PricingTable";
import TextareaPanel from "../components/TextareaPanel";
import useDebouncedValue from "../state/useDebouncedValue";
import Button from "../components/ui/Button";
import { PRESETS } from "../data/presets";
import { useTokenStats } from "../state/useTokenStats";
import StatsPanel from "../components/StatsPanel";

type Theme = "light" | "dark";

const AppView = () => {
  const [text, setText] = useState("");
  const [normalizeOnPaste, setNormalizeOnPaste] = useState(true);
  const [removeInvisible, setRemoveInvisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [primaryModelKey, setPrimaryModelKey] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  const debouncedText = useDebouncedValue(text, 100);

  const pricingData = useMemo(() => {
    try {
      return { models: validatePrices(prices), error: null };
    } catch (error) {
      return { models: [], error };
    }
  }, []);

  const counters = useMemo(() => {
    return {
      characters: countCharacters(debouncedText),
      words: countWords(debouncedText),
    };
  }, [debouncedText]);

  const selectedModel = useMemo(() => {
    if (!primaryModelKey && pricingData.models.length > 0) {
      // Default to GPT-4o or similar if found
      const defaultModel = pricingData.models.find(m => m.model_id === "gpt-4o") ?? pricingData.models[0];
      return defaultModel;
    }
    return pricingData.models.find(m => `${m.provider}::${m.model}` === primaryModelKey);
  }, [primaryModelKey, pricingData.models]);

  const stats = useTokenStats(debouncedText, selectedModel);

  const handleCopySummary = async () => {
    const summary = `LLM Cost Est: ${selectedModel?.model}
Tokens: ${stats?.tokens.toLocaleString()} | Cost: ${stats?.totalCostUSD.toFixed(6)}
Characters: ${counters.characters} | Words: ${counters.words}`;

    await navigator.clipboard.writeText(summary);
    alert("Summary copied!");
  };

  const handleExport = () => {
    const data = {
      model: selectedModel?.model,
      stats,
      counters,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-estimate-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="app" data-theme={theme}>
      <header className="app__header-main">
        <div className="app__top-bar">
          <div className="app__brand">
            Token & Cost Estimator <span className="app__tagary">PRO</span>
          </div>
          <div className="app__actions-row">
            <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
            <Button variant={showCompare ? "primary" : "subtle"} size="sm" onClick={() => setShowCompare(!showCompare)}>
              {showCompare ? "← Back to Editor" : "Compare Models"}
            </Button>
          </div>
        </div>
      </header>

      <main className="app__main-content">
        {!showCompare ? (
          <div className="app__layout-container">
            <div className="app__column-editor">
              <TextareaPanel
                value={text}
                onChange={setText}
                normalizeOnPaste={normalizeOnPaste}
                removeInvisible={removeInvisible}
                presets={PRESETS}
                onPresetSelect={(id) => {
                  const preset = PRESETS.find(p => p.id === id);
                  if (preset) setText(preset.value);
                }}
                onNormalizeOnPasteChange={setNormalizeOnPaste}
                onRemoveInvisibleChange={setRemoveInvisible}
                selectedModel={selectedModel}
              />
            </div>

            <div className="app__column-results">
              <StatsPanel
                text={text}
                stats={stats}
                selectedModelId={primaryModelKey || (selectedModel ? `${selectedModel.provider}::${selectedModel.model}` : "")}
                models={pricingData.models}
                onModelChange={setPrimaryModelKey}
                characterCount={counters.characters}
                wordCount={counters.words}
                onCopySummary={handleCopySummary}
                onExport={handleExport}
              />
            </div>
          </div>
        ) : (
          <div className="app__comparison-view">
            <PricingTable
              models={pricingData.models}
              text={debouncedText}
              computeMode="visible-rows"
            />
          </div>
        )}
      </main>

      <footer className="app__footer">
        <p>100% Client-side · Accuracy depends on model tokenizer availability</p>
      </footer>
    </div>
  );
};

export default AppView;

