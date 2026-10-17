import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TagInput } from "./TagInput";

describe("TagInput", () => {
  it("adds a tag when pressing Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "React{Enter}");

    expect(onChange).toHaveBeenCalledWith(["React"]);
  });

  it("does not add duplicate tags", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["React"]} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "React{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag when clicking its remove button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["React", "Rails"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Remove React"));

    expect(onChange).toHaveBeenCalledWith(["Rails"]);
  });

  it("does not add a tag beyond the max limit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["a"]} onChange={onChange} max={1} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "b{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });
});
