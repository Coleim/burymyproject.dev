import { EMAIL_AUTH_ENABLED } from "@/lib/features";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { lazy, Suspense } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { OAuthButtons } from "./OAuthButtons";
import styles from "./AuthLayout.module.css";
import { useAuth } from "./useAuth";
import { usePageTitle } from "@/shared/lib/usePageTitle";

const EmailLoginForm = lazy(() =>
  import("./EmailLoginForm").then((m) => ({ default: m.EmailLoginForm })),
);

export function LoginPage() {
  usePageTitle(EMAIL_AUTH_ENABLED ? "Log in" : "Sign in");
  const location = useLocation();
  const { session, loading } = useAuth();

  const redirectTo = safeRedirectPath(
    new URLSearchParams(location.search).get("redirectTo"),
    "/my-graves",
  );

  // Also the landing spot after an OAuth round-trip: the provider sends the
  // visitor back here with ?redirectTo= and the session in the URL hash.
  if (!loading && session) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AuthLayout
      title="Back among the living?"
      subtitle={
        EMAIL_AUTH_ENABLED
          ? "Log in to manage your graveyard."
          : "Sign in with GitHub or Google to manage your graveyard."
      }
    >
      {EMAIL_AUTH_ENABLED && (
        <Suspense fallback={null}>
          <EmailLoginForm />
        </Suspense>
      )}
      <OAuthButtons redirectTo={redirectTo} />
      <p className={styles.consent}>
        By continuing you agree to our <Link to="/terms">Terms</Link> and{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </AuthLayout>
  );
}
