import { useId, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { normalizeText } from "../../core/normalization/normalizeText";

type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
  normalizeOnPaste: boolean;
  removeInvisible: boolean;
  onNormalizeOnPasteChange: (value: boolean) => void;
  onRemoveInvisibleChange: (value: boolean) => void;
};

const TextareaPanel = ({
  value,
  onChange,
  normalizeOnPaste,
  removeInvisible,
  onNormalizeOnPasteChange,
  onRemoveInvisibleChange,
}: TextareaPanelProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    <div className="app__card">
      <div className="app__card-header">
        <h2>Input Text</h2>
        <div className="app__button-group">
          <button
            type="button"
            className="app__button app__button--primary"
            onClick={handlePasteButton}
            disabled={!canPaste}
          >
            Paste
          </button>
          <button
            type="button"
            className="app__button"
            onClick={() => onChange("")}
            disabled={!value}
          >
            Clear
          </button>
          <div className="app__popover">
            <button
              type="button"
              className="app__button app__button--icon"
              aria-haspopup="dialog"
              aria-expanded={isSettingsOpen}
              aria-controls={settingsId}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
            >
              Settings
            </button>
            {isSettingsOpen ? (
              <div
                className="app__popover-panel"
                id={settingsId}
                role="dialog"
                aria-label="Paste settings"
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
              </div>
            ) : null}
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
      <div className="app__hint">Character limit: none (soft hint only).</div>
    </div>
  );
};

export default TextareaPanel;
