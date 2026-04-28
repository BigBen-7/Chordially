/**
 * CHORD-109 – Localized auth messaging structure.
 *
 * Provides a typed message catalog for all auth error and success states.
 * Supports en (default) with a simple locale-lookup helper so future
 * locales can be added without changing call sites.
 */

export type AuthMessageKey =
  | "auth.login.success"
  | "auth.login.invalid_credentials"
  | "auth.login.account_banned"
  | "auth.login.unverified_email"
  | "auth.register.success"
  | "auth.register.email_taken"
  | "auth.register.weak_password"
  | "auth.session.expired"
  | "auth.session.invalid_token"
  | "auth.session.not_found"
  | "auth.permission.insufficient_role"
  | "auth.permission.access_denied"
  | "auth.password_reset.sent"
  | "auth.password_reset.invalid_token"
  | "auth.password_reset.expired";

export type Locale = "en";

type MessageCatalog = Record<AuthMessageKey, string>;

const catalogs: Record<Locale, MessageCatalog> = {
  en: {
    "auth.login.success": "You have been signed in.",
    "auth.login.invalid_credentials": "Invalid email or password.",
    "auth.login.account_banned":
      "Your account has been suspended. Contact support to appeal.",
    "auth.login.unverified_email":
      "Please verify your email address before signing in.",
    "auth.register.success": "Account created. Welcome to Chordially!",
    "auth.register.email_taken":
      "An account with this email already exists.",
    "auth.register.weak_password":
      "Password must be at least 8 characters.",
    "auth.session.expired": "Your session has expired. Please sign in again.",
    "auth.session.invalid_token": "Authentication token is invalid.",
    "auth.session.not_found": "No active session found.",
    "auth.permission.insufficient_role":
      "You do not have permission to perform this action.",
    "auth.permission.access_denied": "Access denied.",
    "auth.password_reset.sent":
      "If that email is registered, a reset link has been sent.",
    "auth.password_reset.invalid_token": "Password reset link is invalid.",
    "auth.password_reset.expired":
      "Password reset link has expired. Please request a new one.",
  },
};

/**
 * Look up a localized auth message.
 * Falls back to `en` if the requested locale is not available.
 */
export function getAuthMessage(key: AuthMessageKey, locale: Locale = "en"): string {
  const catalog = catalogs[locale] ?? catalogs.en;
  return catalog[key];
}

/**
 * Build a structured auth error payload suitable for API responses.
 */
export function authErrorPayload(
  key: AuthMessageKey,
  locale: Locale = "en"
): { error: AuthMessageKey; message: string } {
  return { error: key, message: getAuthMessage(key, locale) };
}
