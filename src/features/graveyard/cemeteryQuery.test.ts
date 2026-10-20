import { describe, expect, it } from "vitest";
import { escapeLike, MAX_RESTORED_PAGES, parsePages } from "./cemeteryQuery";

describe("parsePages", () => {
  it.each([
    [null, 1],
    ["", 1],
    ["abc", 1],
    ["0", 1],
    ["-4", 1],
    ["1", 1],
    ["3", 3],
    ["3.9", 3],
    [String(MAX_RESTORED_PAGES), MAX_RESTORED_PAGES],
    ["11", MAX_RESTORED_PAGES],
    ["999999", MAX_RESTORED_PAGES],
  ])("parsePages(%j) = %i", (raw, expected) => {
    expect(parsePages(raw)).toBe(expected);
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards and the escape character", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("back\\slash")).toBe("back\\\\slash");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeLike("atlas 00042")).toBe("atlas 00042");
  });
});
