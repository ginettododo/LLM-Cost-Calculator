import { useId, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { normalizeText } from "../../core/normalization/normalizeText";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Popover from "./ui/Popover";

type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
  normalizeOnPaste: boolean;
  removeInvisible: boolean;
  presets: Array<{ id: string; label: string; approxLabel: string; length: number }>;
  onPresetSelect: (presetId: string) => void;
  onUndoPreset: () => void;
  canUndoPreset: boolean;
  onNormalizeOnPasteChange: (value: boolean) => void;
  onRemoveInvisibleChange: (value: boolean) => void;
  onCopySummary: () => void;
  copySummaryDisabled: boolean;
  isExportOpen: boolean;
  onExportToggle: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  characterCount: number;
  estimatedTokens: number;
};

const TextareaPanel = ({
  value,
  onChange,
  normalizeOnPaste,
  removeInvisible,
  presets,
  onPresetSelect,
  onUndoPreset,
  canUndoPreset,
  onNormalizeOnPasteChange,
  onRemoveInvisibleChange,
  onCopySummary,
  copySummaryDisabled,
  isExportOpen,
  onExportToggle,
  onExportCsv,
  onExportJson,
  characterCount,
  estimatedTokens,
}: TextareaPanelProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
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

  return (
    <Card className="app__input-card">
      <div className="app__textarea-toolbar">
        <div className="app__toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePasteButton}
            disabled={!canPaste}
            title="Paste from clipboard"
          >
            Paste
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange("")} disabled={!value}>
            Clear
          </Button>
          <div className="app__toolbar-divider" />
          <Button variant="ghost" size="sm" onClick={onCopySummary} disabled={copySummaryDisabled}>
            Copy Summary
          </Button>
          <Popover
            isOpen={isExportOpen}
            onClose={() => { if (isExportOpen) onExportToggle(); }}
            panelLabel="Export options"
            panelRole="menu"
            align="end"
            trigger={
              <Button
                variant="ghost"
                size="sm"
                aria-haspopup="menu"
                aria-expanded={isExportOpen}
                onClick={onExportToggle}
              >
                Export
              </Button>
            }
          >
            <button
              type="button"
              className="app__menu-item"
              role="menuitem"
              onClick={onExportCsv}
            >
              Export to CSV
            </button>
            <button
              type="button"
              className="app__menu-item"
              role="menuitem"
              onClick={onExportJson}
            >
              Export to JSON
            </button>
          </Popover>
        </div>

        <div className="app__toolbar-group">
          <Popover
            isOpen={isPresetOpen}
            onClose={() => setIsPresetOpen(false)}
            panelLabel="Preset picker"
            panelRole="menu"
            align="end"
            trigger={
              <Button
                variant="ghost"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndoPreset}
            disabled={!canUndoPreset}
          >
            Undo last preset
          </Button>
          <Popover
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
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
                onChange={(event) =>
                  onNormalizeOnPasteChange(event.target.checked)
                }
              />
              <span>Normalize on paste</span>
            </label>
            <label className="app__toggle">
              <input
                type="checkbox"
                checked={removeInvisible}
                disabled={!normalizeOnPaste}
                onChange={(event) =>
                  onRemoveInvisibleChange(event.target.checked)
                }
              />
              <span>Remove invisible chars</span>
            </label>
            <p className="app__hint app__hint--tight">
              Normalization only applies to paste actions.
            </p>
          </Popover>
        </div>
      </div>

      <textarea
        className="app__textarea"
        placeholder="Paste or type text to estimate tokens and cost."
        aria-label="Text to analyze"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={handlePaste}
        ref={textareaRef}
        rows={10}
      />
      {
        value.trim().length === 0 ? (
          <div className="app__empty-state" aria-live="polite">
            <strong>Paste text, pick a preset, or start typing.</strong>
            <div className="app__hint app__hint--tight">
              Tip: presets include realistic long-form content and unicode stress
              tests.
            </div>
          </div>
        ) : null
      }
      <div className="app__textarea-footer">
        <div className="app__metric">
          <span className="app__metric-label">Characters</span>
          <span className="app__metric-value">
            {characterCount.toLocaleString()}
          </span>
        </div>
        <div className="app__metric">
          <span className="app__metric-label">Estimated tokens</span>
          <span className="app__metric-value">
            {estimatedTokens.toLocaleString()}
          </span>
        </div>
        <Badge tone={normalizeOnPaste ? "success" : "warning"}>
          {normalizeOnPaste ? "Normalized paste" : "Raw paste"}
        </Badge>
      </div>
    </Card >
  );
};

export default TextareaPanel;
