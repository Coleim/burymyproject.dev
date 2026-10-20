import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_TITLE, usePageTitle } from "./usePageTitle";

describe("usePageTitle", () => {
  it("suffixes the site name to a given title", () => {
    renderHook(() => usePageTitle("Cemetery"));
    expect(document.title).toBe("Cemetery · burymyproject.dev");
  });

  it("falls back to the default title and follows title changes", () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: "Cemetery" as string | undefined },
    });
    rerender({ title: "DevFlow — RIP" });
    expect(document.title).toBe("DevFlow — RIP · burymyproject.dev");

    rerender({ title: undefined });
    expect(document.title).toBe(DEFAULT_TITLE);
  });
});
