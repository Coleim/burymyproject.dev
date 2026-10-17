import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CAUSES, EPITAPHS } from "@/lib/constants/graveContent";
import { GraveForm } from "./GraveForm";

describe("GraveForm", () => {
  it("fills the epitaph field with a known phrase when clicking Generate", async () => {
    const user = userEvent.setup();
    render(<GraveForm onSubmit={vi.fn()} />);

    const epitaphInput = screen.getByLabelText("Epitaph") as HTMLInputElement;
    expect(epitaphInput.value).toBe("");

    await user.click(screen.getAllByRole("button", { name: /generate/i })[0]);

    expect(EPITAPHS).toContain(epitaphInput.value);
  });

  it("fills the cause field with a known phrase when clicking Generate", async () => {
    const user = userEvent.setup();
    render(<GraveForm onSubmit={vi.fn()} />);

    const causeInput = screen.getByLabelText(
      "Cause of death",
    ) as HTMLInputElement;
    expect(causeInput.value).toBe("");

    await user.click(screen.getAllByRole("button", { name: /generate/i })[1]);

    expect(CAUSES).toContain(causeInput.value);
  });
});
