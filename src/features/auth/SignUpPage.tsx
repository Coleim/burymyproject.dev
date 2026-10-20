import { EMAIL_AUTH_ENABLED } from "@/lib/features";
import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";

const EmailSignUpPage = lazy(() =>
  import("./EmailSignUpPage").then((m) => ({ default: m.EmailSignUpPage })),
);

// With OAuth-only sign-in there is nothing to "sign up" for: the first
// Google/GitHub login creates the account, so this route leads to /login.
export function SignUpPage() {
  const { search } = useLocation();

  if (!EMAIL_AUTH_ENABLED) {
    return <Navigate to={`/login${search}`} replace />;
  }

  return (
    <Suspense fallback={null}>
      <EmailSignUpPage />
    </Suspense>
  );
}
