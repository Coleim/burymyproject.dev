import { describe, expect, it } from "vitest";
import { graveSchema } from "./grave";

describe("graveSchema", () => {
  it("accepts a minimal valid grave", () => {
    const result = graveSchema.safeParse({
      name: "My Project",
      tech_stack: [],
      is_public: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = graveSchema.safeParse({
      name: "",
      tech_stack: [],
      is_public: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when died is before born", () => {
    const result = graveSchema.safeParse({
      name: "My Project",
      born: "2024-06-01",
      died: "2024-01-01",
      tech_stack: [],
      is_public: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["died"]);
    }
  });

  it("accepts when died is after born", () => {
    const result = graveSchema.safeParse({
      name: "My Project",
      born: "2024-01-01",
      died: "2024-06-01",
      tech_stack: [],
      is_public: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a tech_stack with more than 20 items", () => {
    const result = graveSchema.safeParse({
      name: "My Project",
      tech_stack: Array.from({ length: 21 }, (_, i) => `tech-${i}`),
      is_public: true,
    });
    expect(result.success).toBe(false);
  });
});
