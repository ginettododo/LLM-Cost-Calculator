import { useId, useMemo, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { normalizeText } from "../../core/normalization/normalizeText";
import type { OpenAITokenDetail } from "../../core";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Popover from "./ui/Popover";

type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
  normalizeOnPaste: boolean;
  removeInvisible: boolean;
  showTokenMarkups: boolean;
  onShowTokenMarkupsChange: (value: boolean) => void;
  presets: Array<{ id: string; label: string; approxLabel: string; length: number }>;
  onPresetSelect: (presetId: string) => void;
  onUndoPreset: () => void;
  canUndoPreset: boolean;
  onNormalizeOnPasteChange: (value: boolean) => void;
  onRemoveInvisibleChange: (value: boolean) => void;
  characterCount: number;
  estimatedTokens: number;
  tokenDetails: OpenAITokenDetail[];
  tokenModelLabel: string;
  hasExactOpenAITokenizer: boolean;
};

const TextareaPanel = ({
  value,
  onChange,
  normalizeOnPaste,
  removeInvisible,
  showTokenMarkups,
  onShowTokenMarkupsChange,
  presets,
  onPresetSelect,
  onUndoPreset,
  canUndoPreset,
  onNormalizeOnPasteChange,
  onRemoveInvisibleChange,
  characterCount,
  estimatedTokens,
  tokenDetails,
  tokenModelLabel,
  hasExactOpenAITokenizer,
}: TextareaPanelProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(true);
  const settingsId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyInsert = (insertValue: string, target: HTMLTextAreaElement | null) => {
    if (!target) {
      onChange(value + insertValue);
      return;
    }

    const start = target.selectionStart ?? value.length;
    const end = target.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${insertValue}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      const caretPosition = start + insertValue.length;
      target.setSelectionRange(caretPosition, caretPosition);
      target.focus();
    });
  };

  const getNormalizedText = (rawText: string) => {
    if (!normalizeOnPaste) {
      return rawText;
    }

    return normalizeText(rawText, { removeInvisible });
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!normalizeOnPaste) {
      return;
    }

    event.preventDefault();
    const clipboardText = event.clipboardData.getData("text");
    applyInsert(getNormalizedText(clipboardText), event.currentTarget);
  };

  const handlePasteButton = async () => {
    try {
      const clipboardText = await navigator.clipboard?.readText?.();
      if (clipboardText === undefined) {
        textareaRef.current?.focus();
        return;
      }

      applyInsert(getNormalizedText(clipboardText), textareaRef.current);
    } catch {
      textareaRef.current?.focus();
    }
  };

  const canPaste =
    typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

  const tokenHighlightSlices = useMemo(() => {
    if (!showTokenMarkups || !hasExactOpenAITokenizer || tokenDetails.length === 0) {
      return [];
    }

    const slices: Array<{ key: string; text: string }> = [];
    let cursor = 0;

    tokenDetails.forEach((token) => {
      const safeStart = Math.max(cursor, token.charStart);
      const safeEnd = Math.max(safeStart, token.charEnd);

      if (safeStart > cursor) {
        slices.push({ key: `plain-${cursor}`, text: value.slice(cursor, safeStart) });
      }

      slices.push({ key: `token-${token.index}-${token.tokenId}`, text: value.slice(safeStart, safeEnd) });
      cursor = safeEnd;
    });

    if (cursor < value.length) {
      slices.push({ key: `tail-${cursor}`, text: value.slice(cursor) });
    }

    return slices;
  }, [hasExactOpenAITokenizer, showTokenMarkups, tokenDetails, value]);

  const shouldRenderMarkup =
    showTokenMarkups && hasExactOpenAITokenizer && tokenHighlightSlices.length > 0;

  return (
    <Card className="app__input-card">
      <div className="app__card-header app__card-header--stack">
        <div>
          <h2>Input Text</h2>
          <p className="app__muted">Paste, type, or choose a preset.</p>
        </div>
        <div className="app__actions">
          <div className="app__actions-group">
            <Button variant="primary" onClick={handlePasteButton} disabled={!canPaste}>
              Paste
            </Button>
            <Button onClick={() => onChange("")} disabled={!value}>
              Clear
            </Button>
            <Popover
              isOpen={isPresetOpen}
              panelLabel="Preset picker"
              panelRole="menu"
              align="end"
              trigger={
                <Button
                  aria-haspopup="menu"
                  aria-expanded={isPresetOpen}
                  onClick={() => setIsPresetOpen((prev) => !prev)}
                >
                  Presets
                </Button>
              }
            >
              <div className="app__preset-menu" role="menu">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="app__preset-item"
                    role="menuitem"
                    aria-label={`${preset.label}, approximately ${preset.length.toLocaleString()} characters`}
                    onClick={() => {
                      onPresetSelect(preset.id);
                      setIsPresetOpen(false);
                    }}
                  >
                    <span>
                      <strong>{preset.label}</strong>
                      <span className="app__muted"> {preset.approxLabel}</span>
                    </span>
                    <span className="app__preset-length">{preset.length.toLocaleString()} chars</span>
                  </button>
                ))}
              </div>
            </Popover>
            <Button variant="ghost" size="sm" onClick={onUndoPreset} disabled={!canUndoPreset}>
              Undo last preset
            </Button>
            <Popover
              isOpen={isSettingsOpen}
              panelLabel="Paste settings"
              panelId={settingsId}
              align="end"
              trigger={
                <Button
                  aria-haspopup="dialog"
                  aria-expanded={isSettingsOpen}
                  aria-controls={settingsId}
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                >
                  Settings
                </Button>
              }
            >
              <label className="app__toggle">
                <input
                  type="checkbox"
                  checked={normalizeOnPaste}
                  onChange={(event) => onNormalizeOnPasteChange(event.target.checked)}
                />
                <span>Normalize on paste</span>
              </label>
              <label className="app__toggle">
                <input
                  type="checkbox"
                  checked={removeInvisible}
                  disabled={!normalizeOnPaste}
                  onChange={(event) => onRemoveInvisibleChange(event.target.checked)}
                />
                <span>Remove invisible chars</span>
              </label>
              <label className="app__toggle">
                <input
                  type="checkbox"
                  checked={showTokenMarkups}
                  disabled={!hasExactOpenAITokenizer}
                  onChange={(event) => onShowTokenMarkupsChange(event.target.checked)}
                />
                <span>Show token markups</span>
              </label>
            </Popover>
          </div>
        </div>
      </div>
      <div className="app__textarea-shell">
        {shouldRenderMarkup ? (
          <div className="app__token-overlay" aria-hidden="true">
            {tokenHighlightSlices.map((slice) => (
              <span
                key={slice.key}
                className={slice.key.startsWith("token-") ? "app__token-overlay-mark" : undefined}
              >
                {slice.text || "\u200b"}
              </span>
            ))}
          </div>
        ) : null}
        <textarea
          className="app__textarea"
          placeholder="Paste or type text to estimate tokens and cost."
          aria-label="Text to analyze"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          ref={textareaRef}
          rows={6}
        />
      </div>
      {showTokenMarkups ? (
        <div className="app__token-markup-panel">
          <button
            type="button"
            className="app__token-markup-toggle"
            onClick={() => setIsTokenPanelOpen((prev) => !prev)}
            disabled={!hasExactOpenAITokenizer}
          >
            <strong>Token list {hasExactOpenAITokenizer ? `(${tokenModelLabel})` : ""}</strong>
            <span>{isTokenPanelOpen ? "Hide" : "Show"}</span>
          </button>
          {isTokenPanelOpen ? (
            <div className="app__token-markup-list" role="list">
              {!hasExactOpenAITokenizer ? (
                <p className="app__muted">Token markups are only available for exact OpenAI tokenizer rows.</p>
              ) : tokenDetails.length === 0 ? (
                <p className="app__muted">No tokens to display.</p>
              ) : (
                tokenDetails.map((token) => (
                  <div
                    key={`${token.index}-${token.tokenId}`}
                    className="app__token-markup-row"
                    role="listitem"
                  >
                    <code>#{token.index}</code>
                    <code>{token.tokenId}</code>
                    <code>
                      [{token.charStart}, {token.charEnd})
                    </code>
                    <span>{JSON.stringify(token.text)}</span>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="app__textarea-footer">
        <div className="app__metric">
          <span className="app__metric-label">Characters</span>
          <span className="app__metric-value">{characterCount.toLocaleString()}</span>
        </div>
        <div className="app__metric">
          <span className="app__metric-label">Token estimate</span>
          <span className="app__metric-value">{estimatedTokens.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default TextareaPanel;
