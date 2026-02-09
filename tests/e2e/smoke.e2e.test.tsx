/** @vitest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
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
      expect(screen.getByText(/Tokens: [1-9]/)).toBeTruthy();
    });

    const costCells = screen.getAllByText(/\$\d+\.\d{4}/);
    expect(costCells.length).toBeGreaterThan(0);
  });
});
