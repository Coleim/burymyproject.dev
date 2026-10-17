import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import * as useAuthModule from "./useAuth";

function renderWithAuth(
  authValue: Partial<ReturnType<typeof useAuthModule.useAuth>>,
) {
  vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
    session: null,
    user: null,
    loading: false,
    ...authValue,
  });

  return render(
    <MemoryRouter initialEntries={["/my-graves"]}>
      <Routes>
        <Route
          path="/my-graves"
          element={
            <ProtectedRoute>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while session is being resolved", () => {
    renderWithAuth({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("redirects to /login when there is no session", () => {
    renderWithAuth({ session: null });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children when a session is present", () => {
    renderWithAuth({
      // @ts-expect-error minimal fake session for the test
      session: { user: { id: "1" } },
    });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
