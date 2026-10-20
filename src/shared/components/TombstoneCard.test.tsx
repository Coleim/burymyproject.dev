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

  describe("Founding Ghost", () => {
    const renderCard = (foundingRank?: number | null) =>
      render(
        <MemoryRouter>
          <TombstoneCard name="DevFlow" slug="devflow-abc123" foundingRank={foundingRank} />
        </MemoryRouter>,
      );

    it.each([1, 4, 10])("shows a text badge with the rank %i", (rank) => {
      renderCard(rank);
      expect(screen.getByText(new RegExp(`Founding Ghost\\s*№${rank}$`))).toBeInTheDocument();
    });

    it("does not rely on colour alone: the badge is part of the link's accessible name", () => {
      renderCard(3);
      expect(screen.getByRole("link")).toHaveAccessibleName(/Founding Ghost\s*№3/);
    });

    it("marks the card so the golden styling applies", () => {
      renderCard(2);
      expect(screen.getByRole("link").className).toMatch(/tombstone--founding/);
    });

    it.each([undefined, null, 0])("shows nothing for an ordinary grave (foundingRank = %s)", (rank) => {
      renderCard(rank as number | null | undefined);
      expect(screen.queryByText(/Founding Ghost/)).toBeNull();
      expect(screen.getByRole("link").className).not.toMatch(/tombstone--founding/);
    });

    it("hides the decorative emoji from assistive technology", () => {
      renderCard(1);
      expect(screen.getByText("👻")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
