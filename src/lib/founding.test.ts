import { describe, expect, it } from "vitest";
import { foundingSpotsMessage } from "./founding";

describe("foundingSpotsMessage", () => {
  it.each([
    [0, "Be the first of 10 Founding Ghosts", true],
    [1, "9 of 10 Founding Ghost spots left", true],
    [5, "5 of 10 Founding Ghost spots left", true],
    [8, "2 of 10 Founding Ghost spots left", true],
    [9, "Last Founding Ghost spot!", true],
    [10, "All 10 Founding Ghosts have been claimed", false],
  ])("claimed = %i -> %j (claimable: %s)", (claimed, text, claimable) => {
    expect(foundingSpotsMessage(claimed)).toEqual({ text, claimable });
  });

  it("never reports a negative number of spots, even if the count overshoots", () => {
    expect(foundingSpotsMessage(11)).toEqual({ text: "All 10 Founding Ghosts have been claimed", claimable: false });
    expect(foundingSpotsMessage(999).claimable).toBe(false);
  });
});
