/** @vitest-environment jsdom */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "../../src/app/App";

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
});
