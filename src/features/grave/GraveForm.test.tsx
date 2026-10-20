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

  it("renders the submit button after the preview and linked to the form", () => {
    render(<GraveForm onSubmit={vi.fn()} />);

    const preview = screen.getByTestId("grave-preview");
    const submit = screen.getByRole("button", { name: "Bury the project" });

    expect(submit.getAttribute("form")).toBe("grave-form");
    expect(document.getElementById("grave-form")).not.toBeNull();
    expect(
      preview.compareDocumentPosition(submit) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("prefills the fields from defaultValues and submits the edited values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const tombstone = { bg: "grave_bg_03.webp", fg: "grave_07.webp" };
    render(
      <GraveForm
        onSubmit={onSubmit}
        submitLabel="Save changes"
        tombstone={tombstone}
        defaultValues={{
          name: "Old name",
          epitaph: "Old epitaph",
          born: "2024-01-01",
          died: "2024-02-01",
          cause: "Old cause",
          tech_stack: ["React"],
          is_public: false,
        }}
      />,
    );

    const nameInput = screen.getByLabelText("Project name") as HTMLInputElement;
    expect(nameInput.value).toBe("Old name");
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByLabelText(/publicly visible/i)).not.toBeChecked();

    await user.clear(nameInput);
    await user.type(nameInput, "New name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: "New name",
      epitaph: "Old epitaph",
      is_public: false,
    });
    expect(onSubmit.mock.calls[0][1]).toEqual(tombstone);
  });
});
