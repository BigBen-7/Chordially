/**
 * CHORD-107 – Permission matrix resolution service.
 *
 * Computes which actions a user may perform based on role, account status,
 * and optional feature flags. Returns a flat permission map so callers
 * can check a single boolean rather than re-implementing role logic.
 */

import type { UserRole } from "@chordially/types";

export type Permission =
  | "session:read"
  | "session:write"
  | "profile:read"
  | "profile:write"
  | "artist:publish"
  | "artist:onboard"
  | "tip:send"
  | "tip:receive"
  | "admin:users"
  | "admin:moderation"
  | "admin:audit";

export interface PermissionContext {
  role: UserRole;
  banned?: boolean;
  emailVerified?: boolean;
  onboardingComplete?: boolean;
  featureFlags?: Record<string, boolean>;
}

export type PermissionMap = Record<Permission, boolean>;

const BASE_PERMISSIONS: Record<UserRole, Permission[]> = {
  fan: [
    "session:read",
    "profile:read",
    "profile:write",
    "tip:send",
  ],
  artist: [
    "session:read",
    "session:write",
    "profile:read",
    "profile:write",
    "artist:onboard",
    "tip:receive",
  ],
  admin: [
    "session:read",
    "session:write",
    "profile:read",
    "profile:write",
    "artist:publish",
    "artist:onboard",
    "tip:send",
    "tip:receive",
    "admin:users",
    "admin:moderation",
    "admin:audit",
  ],
};

const ALL_PERMISSIONS: Permission[] = [
  "session:read",
  "session:write",
  "profile:read",
  "profile:write",
  "artist:publish",
  "artist:onboard",
  "tip:send",
  "tip:receive",
  "admin:users",
  "admin:moderation",
  "admin:audit",
];

/**
 * Resolve the full permission map for a user given their context.
 * Banned users lose all permissions. Artists gain publish rights only
 * after onboarding is complete.
 */
export function resolvePermissions(ctx: PermissionContext): PermissionMap {
  const granted = new Set<Permission>();

  if (!ctx.banned) {
    for (const p of BASE_PERMISSIONS[ctx.role] ?? []) {
      granted.add(p);
    }

    // Artists can only publish once onboarding is complete
    if (ctx.role === "artist" && ctx.onboardingComplete) {
      granted.add("artist:publish");
    }
  }

  // Feature-flag overrides: flag name matches permission key
  if (ctx.featureFlags) {
    for (const [flag, enabled] of Object.entries(ctx.featureFlags)) {
      if (ALL_PERMISSIONS.includes(flag as Permission)) {
        if (enabled) {
          granted.add(flag as Permission);
        } else {
          granted.delete(flag as Permission);
        }
      }
    }
  }

  return Object.fromEntries(
    ALL_PERMISSIONS.map((p) => [p, granted.has(p)])
  ) as PermissionMap;
}

/** Convenience: check a single permission. */
export function can(ctx: PermissionContext, permission: Permission): boolean {
  return resolvePermissions(ctx)[permission];
}
