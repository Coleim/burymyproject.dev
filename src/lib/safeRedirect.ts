/**
 * Returns `target` only if it is an in-app path, otherwise `fallback`.
 * Guards the post-login `?redirectTo=` parameter against open redirects
 * (absolute URLs, protocol-relative `//host`, backslash tricks, control
 * characters, `javascript:` and friends).
 */
export function safeRedirectPath(
  target: string | null | undefined,
  fallback: string,
): string {
  if (!target) return fallback;
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//") || target.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(target)) return fallback;

  try {
    const resolved = new URL(target, "https://app.invalid");
    if (resolved.origin !== "https://app.invalid") return fallback;
  } catch {
    return fallback;
  }
  return target;
}
