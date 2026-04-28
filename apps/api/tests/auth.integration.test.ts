// CHORD-101, CHORD-104, CHORD-105: Auth integration tests
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";

function makeServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    server.once("listening", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("bad address");
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () =>
          new Promise<void>((res, rej) =>
            server.close((e) => (e ? rej(e) : res()))
          )
      });
    });
  });
}

// ── CHORD-101: fan registration ──────────────────────────────────────────────

test("CHORD-101: registers a new fan and returns token + sessionId", async () => {
  const { url, close } = await makeServer();
  try {
    const res = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "fan1@example.com", username: "fan_one", password: "password123" })
    });
    const body = await res.json() as Record<string, unknown>;
    assert.equal(res.status, 201);
    assert.ok(body.token, "token present");
    assert.equal((body.user as Record<string, unknown>).role, "fan");
    assert.ok(body.sessionId, "sessionId present");
  } finally {
    await close();
  }
});

test("CHORD-101: rejects duplicate email with 409", async () => {
  const { url, close } = await makeServer();
  try {
    const payload = { email: "dup@example.com", username: "dup_user", password: "password123" };
    await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const res = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, username: "dup_user2" })
    });
    assert.equal(res.status, 409);
  } finally {
    await close();
  }
});

test("CHORD-101: rejects invalid email with 400", async () => {
  const { url, close } = await makeServer();
  try {
    const res = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", username: "user", password: "password123" })
    });
    assert.equal(res.status, 400);
  } finally {
    await close();
  }
});

// ── CHORD-104: device/session management ────────────────────────────────────

test("CHORD-104: returns active sessions for authenticated user", async () => {
  const { url, close } = await makeServer();
  try {
    const regRes = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "sess@example.com", username: "sess_user", password: "password123" })
    });
    const { token } = await regRes.json() as { token: string };

    const res = await fetch(`${url}/auth/devices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json() as { sessions: unknown[] };
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.sessions));
    assert.ok(body.sessions.length > 0);
  } finally {
    await close();
  }
});

test("CHORD-104: revokes a session", async () => {
  const { url, close } = await makeServer();
  try {
    const regRes = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "revoke@example.com", username: "revoke_user", password: "password123" })
    });
    const { token, sessionId } = await regRes.json() as { token: string; sessionId: string };

    const res = await fetch(`${url}/auth/devices/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json() as { ok: boolean };
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
  } finally {
    await close();
  }
});

test("CHORD-104: returns 401 without auth token", async () => {
  const { url, close } = await makeServer();
  try {
    const res = await fetch(`${url}/auth/devices`);
    assert.equal(res.status, 401);
  } finally {
    await close();
  }
});

// ── CHORD-105: account lockout ───────────────────────────────────────────────

test("CHORD-105: locks account after 5 failed login attempts", async () => {
  const { url, close } = await makeServer();
  try {
    await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "lockme@example.com", username: "lock_user", password: "correctpass" })
    });

    for (let i = 0; i < 5; i++) {
      await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "lockme@example.com", password: "wrongpass" })
      });
    }

    const res = await fetch(`${url}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "lockme@example.com", password: "correctpass" })
    });
    const body = await res.json() as { unlockAfter?: string };
    assert.equal(res.status, 423);
    assert.ok(body.unlockAfter, "unlockAfter present");
  } finally {
    await close();
  }
});

test("CHORD-105: admin can list lockouts", async () => {
  const { url, close } = await makeServer();
  try {
    // Create a locked account first
    await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "victim@example.com", username: "victim_user", password: "correctpass" })
    });
    for (let i = 0; i < 5; i++) {
      await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "victim@example.com", password: "wrongpass" })
      });
    }

    // Register admin
    const adminReg = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", username: "admin_user", password: "adminpass1", role: "admin" })
    });
    const { token } = await adminReg.json() as { token: string };

    const res = await fetch(`${url}/auth/admin/lockouts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json() as { lockouts: unknown[] };
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.lockouts));
  } finally {
    await close();
  }
});
