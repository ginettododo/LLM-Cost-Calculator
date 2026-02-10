// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { getOpenAITokenDetails } from "../../src/core";
import TextareaPanel from "../../src/ui/components/TextareaPanel";

describe("TextareaPanel token markup rendering", () => {
  it("renders token overlay and token list when exact OpenAI tokenization is enabled", () => {
    const value = "OpenAI token marks";
    const tokenDetails = getOpenAITokenDetails(value, "openai:gpt-4o");

    const { container } = render(
      <TextareaPanel
        value={value}
        onChange={() => {}}
        normalizeOnPaste={true}
        removeInvisible={false}
        showTokenMarkups={true}
        onShowTokenMarkupsChange={() => {}}
        presets={[]}
        onPresetSelect={() => {}}
        onUndoPreset={() => {}}
        canUndoPreset={false}
        onNormalizeOnPasteChange={() => {}}
        onRemoveInvisibleChange={() => {}}
        characterCount={value.length}
        estimatedTokens={tokenDetails.length}
        tokenDetails={tokenDetails}
        tokenModelLabel="openai:gpt-4o"
        hasExactOpenAITokenizer={true}
      />,
    );

    expect(container.querySelector(".app__token-overlay")).not.toBeNull();
    expect(container.querySelectorAll(".app__token-markup-row").length).toBe(tokenDetails.length);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not render token overlay when exact tokenizer is unavailable", () => {
    const value = "fallback";
    const { container } = render(
      <TextareaPanel
        value={value}
        onChange={() => {}}
        normalizeOnPaste={true}
        removeInvisible={false}
        showTokenMarkups={true}
        onShowTokenMarkupsChange={() => {}}
        presets={[]}
        onPresetSelect={() => {}}
        onUndoPreset={() => {}}
        canUndoPreset={false}
        onNormalizeOnPasteChange={() => {}}
        onRemoveInvisibleChange={() => {}}
        characterCount={value.length}
        estimatedTokens={2}
        tokenDetails={[]}
        tokenModelLabel=""
        hasExactOpenAITokenizer={false}
      />,
    );

    expect(container.querySelector(".app__token-overlay")).toBeNull();
    expect(container.firstChild).toMatchSnapshot();
  });
});
