import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!session) {
    const redirectTo = encodeURIComponent(
      location.pathname + location.search,
    );
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  return <>{children}</>;
}
