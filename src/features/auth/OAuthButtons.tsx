import { supabase } from "@/lib/supabase";
import type { Provider } from "@supabase/supabase-js";
import { useState, type ReactNode } from "react";
import styles from "./AuthLayout.module.css";

type OAuthProvider = {
  provider: Extract<Provider, "google" | "github">;
  label: string;
  icon: ReactNode;
};

const PROVIDERS: OAuthProvider[] = [
  {
    provider: "google",
    label: "Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.96H.96C.35 6.18 0 7.55 0 9s.35 2.82.96 4.04l3.01-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
    ),
  },
  {
    provider: "github",
    label: "GitHub",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
];

export function OAuthButtons() {
  const [pending, setPending] = useState<OAuthProvider["provider"] | null>(
    null,
  );
  const [error, setError] = useState(false);

  async function handleClick(provider: OAuthProvider["provider"]) {
    setPending(provider);
    setError(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
    // On success the browser navigates away to the provider, so the pending
    // state is only reset when something went wrong.
    if (error) {
      setPending(null);
      setError(true);
    }
  }

  return (
    <div className={styles["oauth-group"]}>
      {PROVIDERS.map(({ provider, label, icon }) => (
        <button
          key={provider}
          type="button"
          className={styles["oauth-button"]}
          onClick={() => handleClick(provider)}
          disabled={pending !== null}
        >
          {icon}
          {pending === provider ? "Redirecting..." : `Continue with ${label}`}
        </button>
      ))}
      {error && (
        <p className={styles["oauth-error"]} role="alert">
          Something went wrong. Please try again in a moment.
        </p>
      )}
    </div>
  );
}
