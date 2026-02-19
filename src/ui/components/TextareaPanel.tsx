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

const GearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

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
  const [highlightEnabled] = useState(true);
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

  // Character count for footer
  const charCount = value.length;
  const charPercent = Math.min(charCount / 200_000, 1);

  return (
    <Card noPadding style={{ overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          backgroundColor: "var(--color-bg-subtle)",
        }}
      >
        {/* Left: title + preset */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", flexShrink: 0 }}>
            Input
          </span>
          <div style={{ width: "1px", height: "16px", backgroundColor: "var(--color-border-default)" }} />
          <Select
            aria-label="Load preset"
            value=""
            onChange={(event) => {
              const selectedPreset = event.target.value;
              if (selectedPreset) {
                onPresetSelect(selectedPreset);
              }
            }}
            style={{ width: "200px", fontSize: "12px", padding: "4px 8px", height: "28px" }}
          >
            <option value="">Load Preset…</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.approxLabel
                  ? `${preset.label} (${preset.approxLabel})`
                  : preset.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ClipboardIcon />}
            onClick={handlePasteButton}
            disabled={!canPaste}
          >
            Paste
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<TrashIcon />}
            onClick={() => onChange("")}
            disabled={!value}
          >
            Clear
          </Button>

          <div style={{ width: "1px", height: "16px", backgroundColor: "var(--color-border-default)" }} />

          {/* Settings dropdown */}
          <div style={{ position: "relative" }}>
            <Button
              variant={isSettingsOpen ? "secondary" : "ghost"}
              size="sm"
              leftIcon={<GearIcon />}
              aria-expanded={isSettingsOpen}
              aria-controls={settingsId}
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              Options
            </Button>

            {isSettingsOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 19 }}
                  onClick={() => setIsSettingsOpen(false)}
                />
                <div
                  id={settingsId}
                  className="animate-scale-in"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: "240px",
                    backgroundColor: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    padding: "14px",
                    zIndex: 20,
                  }}
                >
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-text-tertiary)",
                    margin: "0 0 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}>
                    Paste Options
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>Normalize whitespace</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Clean line endings on paste</div>
                      </div>
                      <Toggle checked={normalizeOnPaste} onChange={onNormalizeOnPasteChange} />
                    </label>

                    <div style={{ height: "1px", backgroundColor: "var(--color-border-subtle)" }} />

                    <label style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: normalizeOnPaste ? "pointer" : "not-allowed",
                      opacity: normalizeOnPaste ? 1 : 0.45,
                    }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>Remove invisible chars</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Strip zero-width & format chars</div>
                      </div>
                      <Toggle
                        checked={removeInvisible}
                        onChange={onRemoveInvisibleChange}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Textarea area */}
      <div style={{ position: "relative", minHeight: "220px" }}>
        {highlightEnabled ? (
          <div
            ref={highlighterRef}
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
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
          placeholder="Type or paste your content here to estimate token usage and cost…"
          spellCheck={false}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            minHeight: "220px",
            padding: "16px 20px",
            border: "none",
            resize: "vertical",
            backgroundColor: "transparent",
            color: highlightEnabled ? "transparent" : "var(--color-text-primary)",
            WebkitTextFillColor: highlightEnabled ? "transparent" : "var(--color-text-primary)",
            caretColor: "var(--color-text-primary)",
            fontFamily: "var(--font-family-mono)",
            fontSize: "13.5px",
            lineHeight: "1.65",
            outline: "none",
            whiteSpace: "pre-wrap",
            boxShadow: "none",
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
            <svg
              width="32" height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              style={{ marginBottom: "8px", opacity: 0.4 }}
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 500 }}>Start typing or paste text</p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.65 }}>
              Use the preset dropdown to load sample content
            </p>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div
        style={{
          padding: "6px 14px",
          backgroundColor: "var(--color-bg-subtle)",
          borderTop: "1px solid var(--color-border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "11px",
              color: charPercent > 0.75 ? "var(--color-warning-text)" : "var(--color-text-secondary)",
              fontFamily: "var(--font-family-mono)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {charCount.toLocaleString()} chars
          </span>

          {/* Mini progress bar */}
          {charCount > 0 && (
            <div style={{ width: "80px", height: "3px", backgroundColor: "var(--color-border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(charPercent * 100).toFixed(1)}%`,
                  backgroundColor: charPercent > 0.75
                    ? "var(--color-warning-text)"
                    : charPercent > 0.4
                      ? "var(--color-primary-base)"
                      : "var(--color-success-text)",
                  borderRadius: "2px",
                  transition: "width 0.2s ease, background-color 0.2s ease",
                }}
              />
            </div>
          )}
        </div>

        {selectedModel ? (
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-family-mono)", textAlign: "right" }}>
            tokenizer: {selectedModel.provider}/{selectedModel.model}
          </span>
        ) : null}
      </div>
    </Card>
  );
};

export default TextareaPanel;
