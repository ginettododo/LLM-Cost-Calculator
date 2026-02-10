import { useMemo, useState } from "react";
import { getOpenAITokenDetails } from "../../core";
import type { PricingRow } from "../../core";
import Badge from "./ui/Badge";
import Card from "./ui/Card";

type TokenDebugPanelProps = {
  text: string;
  openAIModels: PricingRow[];
};

const TOKEN_PREVIEW_LIMIT = 250;

const TokenDebugPanel = ({
  text,
  openAIModels,
}: TokenDebugPanelProps) => {
  const [selectedModelId, setSelectedModelId] = useState(openAIModels[0]?.model_id ?? "");

  const selectedModel = useMemo(
    () => openAIModels.find((model) => model.model_id === selectedModelId) ?? openAIModels[0],
    [openAIModels, selectedModelId],
  );

  const tokenDetails = useMemo(() => {
    if (!selectedModel) {
      return [];
    }
    return getOpenAITokenDetails(text, selectedModel.model_id ?? selectedModel.model);
  }, [selectedModel, text]);

  return (
    <Card className="app__debug-panel">
      <div className="app__card-header">
        <div>
          <h2>Tokenizer Debug Panel</h2>
          <p className="app__muted">Inspect exact OpenAI tokenization and byte ranges.</p>
        </div>
        <Badge tone="success">Exact</Badge>
      </div>
      <div className="app__field">
        <label htmlFor="token-debug-model" className="app__label">
          OpenAI model
        </label>
        <select
          id="token-debug-model"
          className="app__select"
          value={selectedModel?.model_id ?? ""}
          onChange={(event) => setSelectedModelId(event.target.value)}
          disabled={openAIModels.length === 0}
        >
          {openAIModels.map((model) => (
            <option key={model.model_id} value={model.model_id}>
              {model.model}
            </option>
          ))}
        </select>
      </div>
      <div className="app__summary-grid">
        <div className="app__summary-item">
          <span className="app__label">Exact token count</span>
          <span className="app__value">{tokenDetails.length.toLocaleString()}</span>
        </div>
        <div className="app__summary-item">
          <span className="app__label">Tokenizer</span>
          <span className="app__value">cl100k_base*</span>
        </div>
      </div>
      <div className="app__debug-columns">
        <div className="app__debug-block">
          <h3>Raw text</h3>
          <pre className="app__debug-text">{text || <span className="app__muted">No text yet.</span>}</pre>
        </div>
        <div className="app__debug-block">
          <h3>Tokens with byte ranges</h3>
          <div className="app__token-list" role="list">
            {tokenDetails.length === 0 ? (
              <div className="app__muted">No tokens to display.</div>
            ) : (
              tokenDetails.slice(0, TOKEN_PREVIEW_LIMIT).map((token) => (
                <div key={`${token.index}-${token.tokenId}`} className="app__token-row" role="listitem">
                  <code>#{token.index}</code>
                  <code>{token.tokenId}</code>
                  <code>
                    [{token.byteStart}, {token.byteEnd})
                  </code>
                  <span>{JSON.stringify(token.text)}</span>
                </div>
              ))
            )}
            {tokenDetails.length > TOKEN_PREVIEW_LIMIT ? (
              <p className="app__hint">
                Showing first {TOKEN_PREVIEW_LIMIT} tokens of {tokenDetails.length.toLocaleString()}.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <p className="app__hint">* OpenAI models fall back to cl100k_base when model-specific maps are unavailable.</p>
    </Card>
  );
};

export default TokenDebugPanel;
