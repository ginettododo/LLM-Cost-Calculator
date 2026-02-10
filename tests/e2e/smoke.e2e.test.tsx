/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import App from "../../src/app/App";

afterEach(() => {
  cleanup();
});

describe("smoke e2e", () => {
  it("loads app, updates counters on paste, and renders costs", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Token & LLM Cost Calculator" }),
    ).toBeTruthy();

    const textarea = screen.getByLabelText("Text to analyze");
    await user.click(textarea);
    await user.paste("Shipping a stable release needs reliable tests.");

    await waitFor(() => {
      const primaryHeading = screen.getByRole("heading", { name: "Primary Model" });
      const primaryCard = primaryHeading.closest(".app__summary-card");
      expect(primaryCard).toBeTruthy();
      const tokenLabel = within(primaryCard as HTMLElement).getByText("Tokens");
      const tokenValue = tokenLabel.parentElement?.querySelector(".app__value");
      expect(tokenValue?.textContent).toMatch(/[1-9]/);
    });

    const costCells = screen.getAllByText(/\$\d/);
    expect(costCells.length).toBeGreaterThan(0);
  });

  it("applies presets and supports undo via persistent action", async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText("Text to analyze") as HTMLTextAreaElement;
    await user.type(textarea, "Original draft text");

    await user.click(screen.getByRole("button", { name: "Presets" }));
    await user.click(
      screen.getByRole("menuitem", {
        name: /Long article ~5,000 chars, approximately 5,003 characters/i,
      }),
    );

    expect(textarea.value.length).toBe(5003);

    const undoButton = screen.getByRole("button", { name: "Undo last preset" });
    expect(undoButton.getAttribute("disabled")).toBeNull();

    await user.click(undoButton);
    expect(textarea.value).toBe("Original draft text");
  });
});
