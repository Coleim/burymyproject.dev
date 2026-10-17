import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { GravePage } from "@/features/grave/GravePage";
import { NewGravePage } from "@/features/grave/NewGravePage";
import { CemeteryPage } from "@/features/graveyard/CemeteryPage";
import { MyGravesPage } from "@/features/graveyard/MyGravesPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/cemetery" element={<CemeteryPage />} />
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
            path="/my-graves"
            element={
              <ProtectedRoute>
                <MyGravesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
