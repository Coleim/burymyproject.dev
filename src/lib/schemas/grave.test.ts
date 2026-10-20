import { describe, expect, it } from "vitest";
import { graveSchema } from "./grave";

const validBase = {
  name: "My Project",
  epitaph: "It lived fast, it died in production.",
  born: "2024-01-01",
  died: "2024-06-01",
  cause: "Shiny New Idea Syndrome",
  tech_stack: [],
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

  describe("project_url", () => {
    it("is optional and accepts an empty string", () => {
      expect(graveSchema.safeParse(validBase).success).toBe(true);
      expect(graveSchema.safeParse({ ...validBase, project_url: "" }).success).toBe(true);
    });

    it.each(["https://github.com/me/project", "http://example.com/a?b=1"])(
      "accepts %s",
      (project_url) => {
        expect(graveSchema.safeParse({ ...validBase, project_url }).success).toBe(true);
      },
    );

    it.each([
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com/file",
      "github.com/me/project",
      "not a url",
    ])("rejects %s", (project_url) => {
      expect(graveSchema.safeParse({ ...validBase, project_url }).success).toBe(false);
    });

    it("rejects links longer than 500 characters", () => {
      const project_url = `https://example.com/${"a".repeat(500)}`;
      expect(graveSchema.safeParse({ ...validBase, project_url }).success).toBe(false);
    });
  });
});
