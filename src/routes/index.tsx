import { LandingPage } from "@/features/landing/LandingPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/signup" element={<SignUpPage />} /> */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/new" element={<NewProjectPage />} /> */}
        {/* <Route path="/stats" element={<StatsPage />} /> */}
        {/* <Route path="/:username" element={<PublicProfilePage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
