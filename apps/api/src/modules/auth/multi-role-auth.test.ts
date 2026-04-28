/**
 * CHORD-110 – End-to-end tests for multi-role auth journeys.
 *
 * Exercises the full register → login → session → role-gated action
 * flow for fan, artist, and admin roles using the in-memory store.
 * Covers primary success paths and key failure modes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createUser, authenticateUser, banUser, upgradeToArtist } from "../auth.store.js";
import { signToken, verifyToken } from "../auth.tokens.js";
import { resolvePermissions } from "../permission-matrix.js";
import { getAuthMessage } from "../auth-messages.js";

// Unique email helper to avoid cross-test collisions in the shared Map
const uid = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe("CHORD-110 fan auth journey", () => {
  it("registers, logs in, and receives a valid token", () => {
    const email = `${uid()}@example.com`;
    const user = createUser({ email, username: "fan_e2e", password: "password123", role: "fan" });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("fan");

    const authed = authenticateUser(email, "password123");
    expect(authed).not.toBeNull();

    const token = signToken(authed!.id);
    const decoded = verifyToken(token);
    expect(decoded).toBe(authed!.id);
  });

  it("fan has tip:send but not artist:publish", () => {
    const perms = resolvePermissions({ role: "fan" });
    expect(perms["tip:send"]).toBe(true);
    expect(perms["artist:publish"]).toBe(false);
  });

  it("login fails with wrong password", () => {
    const email = `${uid()}@example.com`;
    createUser({ email, username: "fan_bad_pw", password: "correct_pw", role: "fan" });
    const result = authenticateUser(email, "wrong_pw");
    expect(result).toBeNull();
  });

  it("login fails for unknown email", () => {
    const result = authenticateUser("nobody@example.com", "password123");
    expect(result).toBeNull();
  });

  it("banned fan loses all permissions", () => {
    const email = `${uid()}@example.com`;
    const user = createUser({ email, username: "banned_fan", password: "password123", role: "fan" });
    banUser(user!.id);
    const perms = resolvePermissions({ role: "fan", banned: true });
    expect(Object.values(perms).every((v) => v === false)).toBe(true);
  });

  it("returns localized error message on bad credentials", () => {
    const msg = getAuthMessage("auth.login.invalid_credentials");
    expect(msg).toBeTruthy();
  });
});

describe("CHORD-110 artist auth journey", () => {
  it("registers as artist and gets artist permissions", () => {
    const email = `${uid()}@example.com`;
    const user = createUser({ email, username: "artist_e2e", password: "password123", role: "artist" });
    expect(user!.role).toBe("artist");

    const perms = resolvePermissions({ role: "artist" });
    expect(perms["tip:receive"]).toBe(true);
    expect(perms["artist:onboard"]).toBe(true);
    expect(perms["artist:publish"]).toBe(false); // not yet onboarded
  });

  it("artist gains publish permission after onboarding", () => {
    const perms = resolvePermissions({ role: "artist", onboardingComplete: true });
    expect(perms["artist:publish"]).toBe(true);
  });

  it("fan upgrades to artist and gets artist permissions", () => {
    const email = `${uid()}@example.com`;
    const fan = createUser({ email, username: "upgrading_fan", password: "password123", role: "fan" });
    expect(fan!.role).toBe("fan");

    const artist = upgradeToArtist(fan!.id);
    expect(artist!.role).toBe("artist");

    const perms = resolvePermissions({ role: "artist" });
    expect(perms["tip:receive"]).toBe(true);
  });

  it("artist redirect message is localized", () => {
    const msg = getAuthMessage("auth.permission.insufficient_role");
    expect(msg).toBeTruthy();
  });
});

describe("CHORD-110 admin auth journey", () => {
  it("admin has full permission set", () => {
    const perms = resolvePermissions({ role: "admin" });
    expect(perms["admin:users"]).toBe(true);
    expect(perms["admin:moderation"]).toBe(true);
    expect(perms["admin:audit"]).toBe(true);
    expect(perms["artist:publish"]).toBe(true);
    expect(perms["tip:send"]).toBe(true);
  });

  it("admin token round-trips correctly", () => {
    const email = `${uid()}@example.com`;
    const admin = createUser({ email, username: "admin_e2e", password: "password123", role: "admin" });
    const token = signToken(admin!.id);
    expect(verifyToken(token)).toBe(admin!.id);
  });

  it("expired / invalid token returns null", () => {
    expect(verifyToken("not.a.real.token")).toBeNull();
  });
});
