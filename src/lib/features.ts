// Email/password sign-in needs reliable transactional email (Supabase's default
// mailer allows 2 messages per hour), so it is off for now: sign-in is
// Google/GitHub only. To bring it back, flip this flag at build time AND
// re-enable the email provider in Supabase (external_email_enabled), and
// update the privacy policy (it says we never store a password).
export const EMAIL_AUTH_ENABLED =
  import.meta.env.VITE_AUTH_EMAIL_ENABLED === "true";
