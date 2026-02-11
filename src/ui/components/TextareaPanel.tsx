import { useId, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { normalizeText } from "../../core/normalization/normalizeText";
import { PricingRow } from "../../core/types/pricing";
import Button from "./ui/Button";
import Popover from "./ui/Popover";
import TokenHighlighter from "./TokenHighlighter";
import Toggle from "./ui/Toggle";

type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
  normalizeOnPaste: boolean;
  removeInvisible: boolean;
  presets: Array<{ id: string; label: string; approxLabel: string; length: number }>;
  onPresetSelect: (presetId: string) => void;
  onNormalizeOnPasteChange: (value: boolean) => void;
  onRemoveInvisibleChange: (value: boolean) => void;
  selectedModel: PricingRow | undefined;
};

const TextareaPanel = ({
  value,
  onChange,
  normalizeOnPaste,
  removeInvisible,
  presets,
  onPresetSelect,
  onNormalizeOnPasteChange,
  onRemoveInvisibleChange,
  selectedModel,
}: TextareaPanelProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const settingsId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

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
    if (!normalizeOnPaste) return;
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

  const canPaste = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

  return (
    <div className="app__editor-card">
      <div className="app__textarea-toolbar">
        <div className="app__toolbar-group">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePasteButton}
            disabled={!canPaste}
          >
            Paste
          </Button>

          <Popover
            isOpen={isPresetOpen}
            onClose={() => setIsPresetOpen(false)}
            panelLabel="Preset picker"
            panelRole="menu"
            align="start"
            trigger={
              <Button
                variant="subtle"
                size="sm"
                aria-haspopup="menu"
                aria-expanded={isPresetOpen}
                onClick={() => setIsPresetOpen((prev) => !prev)}
              >
                Presets ▾
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
                  onClick={() => {
                    onPresetSelect(preset.id);
                    setIsPresetOpen(false);
                  }}
                >
                  <span>
                    <strong>{preset.label}</strong>
                    <span className="app__muted"> {preset.approxLabel}</span>
                  </span>
                  <span className="app__preset-length">
                    {preset.length.toLocaleString()} chars
                  </span>
                </button>
              ))}
            </div>
          </Popover>
        </div>

        <div className="app__toolbar-spacer" style={{ flex: 1 }} />

        <div className="app__toolbar-group">
          <Toggle
            id="highlight-toggle"
            checked={highlightEnabled}
            onChange={(e) => setHighlightEnabled(e.target.checked)}
            label="Highlight"
          />

          <div className="app__toolbar-divider" />

          <Button variant="ghost" size="sm" onClick={() => onChange("")} disabled={!value}>
            Clear
          </Button>

          <Popover
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            panelLabel="Settings"
            panelId={settingsId}
            align="end"
            trigger={
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-haspopup="dialog"
                aria-expanded={isSettingsOpen}
                aria-controls={settingsId}
                onClick={() => setIsSettingsOpen((prev) => !prev)}
              >
                ⚙️
              </Button>
            }
          >
            <div className="app__settings-popover">
              <Toggle
                id="normalize-paste"
                label="Normalize on paste"
                checked={normalizeOnPaste}
                onChange={(e) => onNormalizeOnPasteChange(e.target.checked)}
              />
              <Toggle
                id="remove-invisible"
                label="Remove invisible chars"
                checked={removeInvisible}
                disabled={!normalizeOnPaste}
                onChange={(e) => onRemoveInvisibleChange(e.target.checked)}
              />
              <p className="app__hint">Only affects paste actions.</p>
            </div>
          </Popover>
        </div>
      </div>

      <div className="app__editor-wrapper">
        <div
          ref={highlighterRef}
          className="app__highlighter-container"
        >
          <TokenHighlighter
            text={value}
            model={selectedModel}
            isEnabled={highlightEnabled}
          />
        </div>
        <textarea
          className={`app__textarea ${highlightEnabled ? 'app__textarea--overlay' : ''}`}
          placeholder="Paste or type text to estimate tokens and cost."
          aria-label="Text to analyze"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          ref={textareaRef}
          onScroll={(e) => {
            if (highlighterRef.current) {
              highlighterRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          rows={12}
        />
        {value.length === 0 && (
          <div className="app__editor-empty">
            <div className="app__empty-icon">📝</div>
            <p>Enter text to see token counts and costs</p>
            <div className="app__empty-actions">
              <Button size="sm" variant="subtle" onClick={handlePasteButton}>Paste from clipboard</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextareaPanel;
