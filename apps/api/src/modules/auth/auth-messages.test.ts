import { describe, it, expect } from "vitest";
import { getAuthMessage, authErrorPayload } from "../auth-messages.js";

describe("CHORD-109 localized auth messaging", () => {
  it("returns an English message for a known key", () => {
    const msg = getAuthMessage("auth.login.invalid_credentials");
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });

  it("returns a message for every defined key", () => {
    const keys = [
      "auth.login.success",
      "auth.login.invalid_credentials",
      "auth.login.account_banned",
      "auth.login.unverified_email",
      "auth.register.success",
      "auth.register.email_taken",
      "auth.register.weak_password",
      "auth.session.expired",
      "auth.session.invalid_token",
      "auth.session.not_found",
      "auth.permission.insufficient_role",
      "auth.permission.access_denied",
      "auth.password_reset.sent",
      "auth.password_reset.invalid_token",
      "auth.password_reset.expired",
    ] as const;

    for (const key of keys) {
      expect(getAuthMessage(key)).toBeTruthy();
    }
  });

  it("authErrorPayload returns structured object", () => {
    const payload = authErrorPayload("auth.login.account_banned");
    expect(payload.error).toBe("auth.login.account_banned");
    expect(typeof payload.message).toBe("string");
  });

  it("falls back to en for unknown locale", () => {
    // @ts-expect-error testing unknown locale fallback
    const msg = getAuthMessage("auth.login.success", "fr");
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});
