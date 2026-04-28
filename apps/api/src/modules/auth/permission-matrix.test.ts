import { describe, it, expect } from "vitest";
import { resolvePermissions, can } from "../permission-matrix.js";

describe("CHORD-107 permission matrix resolution", () => {
  it("fan can send tips but cannot publish or admin", () => {
    const perms = resolvePermissions({ role: "fan" });
    expect(perms["tip:send"]).toBe(true);
    expect(perms["artist:publish"]).toBe(false);
    expect(perms["admin:users"]).toBe(false);
  });

  it("artist without onboarding cannot publish", () => {
    const perms = resolvePermissions({ role: "artist", onboardingComplete: false });
    expect(perms["artist:publish"]).toBe(false);
    expect(perms["artist:onboard"]).toBe(true);
  });

  it("artist with onboarding complete can publish", () => {
    const perms = resolvePermissions({ role: "artist", onboardingComplete: true });
    expect(perms["artist:publish"]).toBe(true);
  });

  it("admin has all permissions", () => {
    const perms = resolvePermissions({ role: "admin" });
    expect(perms["admin:users"]).toBe(true);
    expect(perms["admin:moderation"]).toBe(true);
    expect(perms["admin:audit"]).toBe(true);
    expect(perms["artist:publish"]).toBe(true);
  });

  it("banned user has no permissions", () => {
    const perms = resolvePermissions({ role: "artist", banned: true, onboardingComplete: true });
    expect(Object.values(perms).every((v) => v === false)).toBe(true);
  });

  it("feature flag can revoke a permission", () => {
    const perms = resolvePermissions({
      role: "fan",
      featureFlags: { "tip:send": false }
    });
    expect(perms["tip:send"]).toBe(false);
  });

  it("feature flag can grant an extra permission", () => {
    const perms = resolvePermissions({
      role: "fan",
      featureFlags: { "session:write": true }
    });
    expect(perms["session:write"]).toBe(true);
  });

  it("can() convenience helper works", () => {
    expect(can({ role: "admin" }, "admin:audit")).toBe(true);
    expect(can({ role: "fan" }, "admin:audit")).toBe(false);
  });
});
