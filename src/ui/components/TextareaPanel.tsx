import { useId, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { normalizeText } from "../../core/normalization/normalizeText";
import type { PricingRow } from "../../core/types/pricing";
import TokenHighlighter from "./TokenHighlighter";
import { Button, Card, Select, Toggle } from "./base";

type PresetOption = {
  id: string;
  label: string;
  approxLabel?: string;
  length?: number;
};

type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
  normalizeOnPaste: boolean;
  removeInvisible: boolean;
  presets: PresetOption[];
  onPresetSelect: (presetId: string) => void;
  onNormalizeOnPasteChange: (value: boolean) => void;
  onRemoveInvisibleChange: (value: boolean) => void;
  selectedModel?: PricingRow;
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
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const settingsId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlighterRef = useRef<HTMLDivElement | null>(null);

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
    <Card className="flex flex-col gap-4" noPadding>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Input</h2>

          <Select
            aria-label="Load preset"
            value=""
            onChange={(event) => {
              const selectedPreset = event.target.value;
              if (selectedPreset) {
                onPresetSelect(selectedPreset);
              }
            }}
            style={{ width: "220px", fontSize: "12px", padding: "6px 8px" }}
          >
            <option value="">Load Preset...</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.approxLabel
                  ? `${preset.label} (${preset.approxLabel})`
                  : preset.label}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Toggle
            label="Highlight"
            checked={highlightEnabled}
            onChange={setHighlightEnabled}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePasteButton}
            disabled={!canPaste}
          >
            Paste
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={!value}
          >
            Clear
          </Button>

          <div style={{ position: "relative" }}>
            <Button
              variant={isSettingsOpen ? "secondary" : "ghost"}
              size="sm"
              aria-expanded={isSettingsOpen}
              aria-controls={settingsId}
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              Settings
            </Button>

            {isSettingsOpen && (
              <div
                id={settingsId}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "260px",
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "16px",
                  zIndex: 20,
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    margin: "0 0 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Paste Options
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px" }}>Normalize</span>
                    <Toggle checked={normalizeOnPaste} onChange={onNormalizeOnPasteChange} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      opacity: normalizeOnPaste ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>Remove Invisible</span>
                    <Toggle
                      checked={removeInvisible}
                      onChange={onRemoveInvisibleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ position: "relative", minHeight: "240px" }}>
        {highlightEnabled ? (
          <div
            ref={highlighterRef}
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              borderBottom: "1px solid var(--color-border-subtle)",
              pointerEvents: "none",
            }}
          >
            <TokenHighlighter
              text={value}
              model={selectedModel}
              isEnabled={highlightEnabled}
            />
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          onScroll={(event) => {
            if (highlighterRef.current) {
              highlighterRef.current.scrollTop = event.currentTarget.scrollTop;
              highlighterRef.current.scrollLeft = event.currentTarget.scrollLeft;
            }
          }}
          placeholder="Type or paste content here..."
          spellCheck={false}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            minHeight: "240px",
            padding: "16px 20px",
            border: "none",
            borderBottom: "1px solid var(--color-border-subtle)",
            resize: "vertical",
            backgroundColor: "transparent",
            color: highlightEnabled ? "transparent" : "var(--color-text-primary)",
            WebkitTextFillColor: highlightEnabled ? "transparent" : "var(--color-text-primary)",
            caretColor: "var(--color-text-primary)",
            fontFamily: "var(--font-family-mono)",
            fontSize: "14px",
            lineHeight: "1.6",
            outline: "none",
            whiteSpace: "pre-wrap",
          }}
        />

        {value.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              textAlign: "center",
              color: "var(--color-text-tertiary)",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px" }}>Start typing or paste text</p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.7 }}>
              Use presets to test quickly
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "8px 20px",
          backgroundColor: "var(--color-bg-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          {value.length.toLocaleString()} characters
        </span>

        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
          {selectedModel ? `Tokenizer: ${selectedModel.provider} ${selectedModel.model}` : "Tokenizer: auto"}
        </span>
      </div>
    </Card>
  );
};

export default TextareaPanel;
