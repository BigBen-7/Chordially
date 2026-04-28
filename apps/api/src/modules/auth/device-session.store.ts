import crypto from "node:crypto";

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
  revoked: boolean;
}

const sessions = new Map<string, DeviceSession>();

export function createDeviceSession(
  userId: string,
  deviceName: string,
  ipAddress: string
): DeviceSession {
  const session: DeviceSession = {
    id: crypto.randomUUID(),
    userId,
    deviceName,
    ipAddress,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    revoked: false
  };
  sessions.set(session.id, session);
  console.info("[device-session] created", { sessionId: session.id, userId });
  return session;
}

export function getSessionsByUser(userId: string): DeviceSession[] {
  return [...sessions.values()].filter((s) => s.userId === userId && !s.revoked);
}

export function revokeSession(sessionId: string, userId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.userId !== userId) return false;
  session.revoked = true;
  console.info("[device-session] revoked", { sessionId, userId });
  return true;
}
