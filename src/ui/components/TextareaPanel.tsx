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
  presets: Array<{ id: string; label: string }>;
  onPresetSelect: (presetId: string) => void;
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
  const [selectedPreset, setSelectedPreset] = useState("");
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
      <div className="app__card-header app__card-header--stack">
        <div>
          <h2>Input Text</h2>
          <p className="app__muted">
            Paste, type, or choose a preset. We keep counts live as you edit.
          </p>
        </div>
        <div className="app__actions">
          <div className="app__actions-group">
            <Button
              variant="primary"
              onClick={handlePasteButton}
              disabled={!canPaste}
            >
              Paste
            </Button>
            <Button onClick={() => onChange("")} disabled={!value}>
              Clear
            </Button>
          </div>
          <div className="app__actions-group">
            <Button onClick={onCopySummary} disabled={copySummaryDisabled}>
              Copy summary
            </Button>
            <Popover
              isOpen={isExportOpen}
              panelLabel="Export options"
              panelRole="menu"
              align="end"
              trigger={
                <Button
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
                Export current results to CSV
              </button>
              <button
                type="button"
                className="app__menu-item"
                role="menuitem"
                onClick={onExportJson}
              >
                Export current results to JSON
              </button>
            </Popover>
            <label className="app__preset-control">
              <span className="app__sr-only">Presets</span>
              <select
                className="app__select"
                aria-label="Presets"
                value={selectedPreset}
                onChange={(event) => {
                  const presetId = event.target.value;
                  setSelectedPreset("");
                  if (!presetId) {
                    return;
                  }
                  onPresetSelect(presetId);
                }}
              >
                <option value="">Presets</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
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
      {value.trim().length === 0 ? (
        <div className="app__empty-state" aria-live="polite">
          <strong>Start by pasting text or picking a preset.</strong>
          <div className="app__hint app__hint--tight">
            Tip: use Presets to test short, long, code, and unicode inputs quickly.
          </div>
        </div>
      ) : null}
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
    </Card>
  );
};

export default TextareaPanel;
