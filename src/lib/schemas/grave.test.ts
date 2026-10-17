import { describe, expect, it } from "vitest";
import { graveSchema } from "./grave";

const validBase = {
  name: "My Project",
  epitaph: "It lived fast, it died in production.",
  born: "2024-01-01",
  died: "2024-06-01",
  cause: "Shiny New Idea Syndrome",
  tech_stack: [],
  is_public: true,
};

describe("graveSchema", () => {
  it("accepts a fully valid grave", () => {
    const result = graveSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = graveSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing epitaph", () => {
    const result = graveSchema.safeParse({ ...validBase, epitaph: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date of birth", () => {
    const result = graveSchema.safeParse({ ...validBase, born: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date of death", () => {
    const result = graveSchema.safeParse({ ...validBase, died: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing cause of death", () => {
    const result = graveSchema.safeParse({ ...validBase, cause: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when died is before born", () => {
    const result = graveSchema.safeParse({
      ...validBase,
      born: "2024-06-01",
      died: "2024-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["died"]);
    }
  });

  it("accepts when died is after born", () => {
    const result = graveSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects a tech_stack with more than 20 items", () => {
    const result = graveSchema.safeParse({
      ...validBase,
      tech_stack: Array.from({ length: 21 }, (_, i) => `tech-${i}`),
    });
    expect(result.success).toBe(false);
  });
});
