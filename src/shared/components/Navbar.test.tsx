import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as useAuthModule from "@/features/auth/useAuth";
import { Navbar } from "./Navbar";

function renderNavbar() {
  vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
    session: null,
    user: null,
    loading: false,
  });

  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe("Navbar mobile menu", () => {
  it("toggles aria-expanded when clicking the menu button", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the menu after clicking a link", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: /log in/i }));

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});

describe("Navbar sign-in links", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function renderWithFlag(enabled: "true" | "false") {
    vi.stubEnv("VITE_AUTH_EMAIL_ENABLED", enabled);
    vi.resetModules();
    const { Navbar: FlagNavbar } = await import("./Navbar");
    const useAuthModule = await import("@/features/auth/useAuth");
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      session: null,
      user: null,
      loading: false,
    });
    return render(
      <MemoryRouter>
        <FlagNavbar />
      </MemoryRouter>,
    );
  }

  it("shows Log In and Sign Up when email auth is enabled", async () => {
    await renderWithFlag("true");
    expect(screen.getByRole("link", { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign up$/i })).toBeInTheDocument();
  });

  it("shows a single Sign in link when sign-in is OAuth-only", async () => {
    await renderWithFlag("false");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /^sign up$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^log in$/i })).toBeNull();
  });
});
