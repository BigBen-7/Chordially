const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface LockoutRecord {
  userId: string;
  email: string;
  failedAttempts: number;
  lockedAt: string | null;
  lockReason: string | null;
  unlockAfter: string | null;
}

const lockouts = new Map<string, LockoutRecord>();

export function recordFailedAttempt(email: string, userId: string): LockoutRecord {
  const existing = lockouts.get(email) ?? {
    userId,
    email,
    failedAttempts: 0,
    lockedAt: null,
    lockReason: null,
    unlockAfter: null
  };

  existing.failedAttempts += 1;

  if (existing.failedAttempts >= MAX_ATTEMPTS && !existing.lockedAt) {
    existing.lockedAt = new Date().toISOString();
    existing.lockReason = `${MAX_ATTEMPTS} consecutive failed login attempts`;
    existing.unlockAfter = new Date(Date.now() + WINDOW_MS).toISOString();
    console.warn("[lockout] account locked", { email, userId });
  }

  lockouts.set(email, existing);
  return existing;
}

export function isLocked(email: string): boolean {
  const record = lockouts.get(email);
  if (!record?.lockedAt) return false;
  if (record.unlockAfter && new Date(record.unlockAfter) < new Date()) {
    record.lockedAt = null;
    record.lockReason = null;
    record.unlockAfter = null;
    record.failedAttempts = 0;
    return false;
  }
  return true;
}

export function unlockAccount(email: string): boolean {
  const record = lockouts.get(email);
  if (!record) return false;
  record.lockedAt = null;
  record.lockReason = null;
  record.unlockAfter = null;
  record.failedAttempts = 0;
  console.info("[lockout] account manually unlocked", { email });
  return true;
}

export function getAllLockouts(): LockoutRecord[] {
  return [...lockouts.values()].filter((r) => r.lockedAt !== null);
}

export function getLockout(email: string): LockoutRecord | null {
  return lockouts.get(email) ?? null;
}
