import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirect";

const FALLBACK = "/my-graves";

describe("safeRedirectPath", () => {
  it.each([
    "/my-graves",
    "/graves/new",
    "/graves/abc-123/edit",
    "/cemetery?q=atlas",
    "/graves/abc#top",
  ])("keeps the in-app path %s", (path) => {
    expect(safeRedirectPath(path, FALLBACK)).toBe(path);
  });

  it.each([
    "https://evil.com",
    "http://evil.com/login",
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "\\/evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "evil.com",
    "my-graves",
    "",
    "   /my-graves",
  ])("rejects %j", (value) => {
    expect(safeRedirectPath(value, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when nothing is provided", () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
