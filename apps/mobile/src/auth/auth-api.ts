import { getMobileConfig } from "../config";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
  sessionId: string;
}

export async function apiRegister(
  email: string,
  username: string,
  password: string
): Promise<AuthResult> {
  const { apiUrl } = getMobileConfig();
  const res = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, role: "fan" })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Registration failed (${res.status})`);
  }

  return res.json() as Promise<AuthResult>;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResult> {
  const { apiUrl } = getMobileConfig();
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Login failed (${res.status})`);
  }

  return res.json() as Promise<AuthResult>;
}
