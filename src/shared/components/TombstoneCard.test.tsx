import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TombstoneCard } from "./TombstoneCard";

describe("TombstoneCard", () => {
  it("renders the project name and epitaph", () => {
    render(
      <MemoryRouter>
        <TombstoneCard
          name="DevFlow"
          startDate="Jan 2024"
          endDate="Feb 2024"
          epitaph="The README was the entire product."
          cause="Scope Creep"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("DevFlow")).toBeInTheDocument();
    expect(
      screen.getByText('"The README was the entire product."'),
    ).toBeInTheDocument();
    expect(screen.getByText("Scope Creep")).toBeInTheDocument();
  });

  it("renders as a link to the grave page when a slug is provided", () => {
    render(
      <MemoryRouter>
        <TombstoneCard name="DevFlow" slug="devflow-abc123" />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /devflow/i });
    expect(link).toHaveAttribute("href", "/graves/devflow-abc123");
  });

  it("renders as a non-interactive card when no slug is provided", () => {
    render(
      <MemoryRouter>
        <TombstoneCard name="DevFlow" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
