import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { OAuthButtons } from "./OAuthButtons";

describe("OAuthButtons", () => {
  const signInWithOAuth = vi.spyOn(supabase.auth, "signInWithOAuth");

  beforeEach(() => {
    signInWithOAuth.mockReset();
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://example.com" },
      error: null,
    });
  });

  it("offers Google and GitHub", () => {
    render(<OAuthButtons />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeInTheDocument();
  });

  it.each([
    ["Google", "google"],
    ["GitHub", "github"],
  ])("starts the %s flow with the app as redirect target", async (label, provider) => {
    const user = userEvent.setup();
    render(<OAuthButtons />);

    await user.click(screen.getByRole("button", { name: new RegExp(`continue with ${label}`, "i") }));

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider,
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
  });

  it("disables every button while a provider redirect is pending", async () => {
    const user = userEvent.setup();
    render(<OAuthButtons />);

    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    expect(screen.getByRole("button", { name: /redirecting/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDisabled();
  });

  it("shows an error and re-enables the buttons when the sign-in fails", async () => {
    const user = userEvent.setup();
    signInWithOAuth.mockResolvedValue({
      data: { provider: "github", url: null },
      error: new Error("nope") as never,
    });
    render(<OAuthButtons />);

    await user.click(screen.getByRole("button", { name: /continue with github/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeEnabled();
  });
});
