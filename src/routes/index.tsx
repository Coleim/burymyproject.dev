import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { GravePage } from "@/features/grave/GravePage";
import { CemeteryPage } from "@/features/graveyard/CemeteryPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { RouteFallback } from "@/shared/components/RouteFallback";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Pages that pull in the form/validation stack (react-hook-form + zod) or are
// rarely an entry point are split into their own chunks.
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import("@/features/auth/SignUpPage").then((m) => ({ default: m.SignUpPage })),
);
const NewGravePage = lazy(() =>
  import("@/features/grave/NewGravePage").then((m) => ({
    default: m.NewGravePage,
  })),
);
const EditGravePage = lazy(() =>
  import("@/features/grave/EditGravePage").then((m) => ({
    default: m.EditGravePage,
  })),
);
const MyGravesPage = lazy(() =>
  import("@/features/graveyard/MyGravesPage").then((m) => ({
    default: m.MyGravesPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("@/features/legal/PrivacyPage").then((m) => ({
    default: m.PrivacyPage,
  })),
);

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/cemetery" element={<CemeteryPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/graves/:slug" element={<GravePage />} />
            <Route
              path="/graves/new"
              element={
                <ProtectedRoute>
                  <NewGravePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graves/:slug/edit"
              element={
                <ProtectedRoute>
                  <EditGravePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-graves"
              element={
                <ProtectedRoute>
                  <MyGravesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
