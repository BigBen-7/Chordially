import { Router } from "express";
import type { AuthResponse, SessionResponse } from "@chordially/types";
import { validateBody } from "../../lib/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { authenticateUser, createUser } from "./auth.store.js";
import { requireAuth } from "./auth.middleware.js";
import { signToken } from "./auth.tokens.js";
import { createDeviceSession, getSessionsByUser, revokeSession } from "./device-session.store.js";
import { getAllLockouts, getLockout, isLocked, recordFailedAttempt, unlockAccount } from "./lockout.store.js";

export const authRouter = Router();

// CHORD-101: fan registration
authRouter.post("/register", validateBody(registerSchema), (req, res) => {
  const user = createUser(req.body);

  if (!user) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  console.info("[register] fan account created", { userId: user.id, role: user.role });

  const token = signToken(user.id);
  const deviceSession = createDeviceSession(
    user.id,
    req.headers["user-agent"] ?? "unknown",
    req.ip ?? "unknown"
  );

  const response: AuthResponse = { token, user };
  res.status(201).json({ ...response, sessionId: deviceSession.id });
});

authRouter.post("/login", validateBody(loginSchema), (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (isLocked(email)) {
    const record = getLockout(email);
    res.status(423).json({
      error: "Account is temporarily locked",
      unlockAfter: record?.unlockAfter
    });
    return;
  }

  const user = authenticateUser(email, password);

  if (!user) {
    recordFailedAttempt(email, "unknown");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id);
  const deviceSession = createDeviceSession(
    user.id,
    req.headers["user-agent"] ?? "unknown",
    req.ip ?? "unknown"
  );

  const response: AuthResponse = { token, user };
  res.status(200).json({ ...response, sessionId: deviceSession.id });
});

authRouter.get("/session", requireAuth, (req, res) => {
  const response: SessionResponse = {
    authenticated: true,
    user: req.authUser ?? null
  };
  res.status(200).json(response);
});

// CHORD-104: device/session management
authRouter.get("/devices", requireAuth, (req, res) => {
  const userId = req.authUser!.id;
  const deviceSessions = getSessionsByUser(userId);
  res.status(200).json({ sessions: deviceSessions });
});

authRouter.delete("/devices/:sessionId", requireAuth, (req, res) => {
  const userId = req.authUser!.id;
  const revoked = revokeSession(req.params.sessionId, userId);
  if (!revoked) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.status(200).json({ ok: true });
});

// CHORD-105: admin lockout tooling
authRouter.get("/admin/lockouts", requireAuth, (req, res) => {
  if (req.authUser?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.status(200).json({ lockouts: getAllLockouts() });
});

authRouter.post("/admin/lockouts/:email/unlock", requireAuth, (req, res) => {
  if (req.authUser?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const unlocked = unlockAccount(req.params.email);
  if (!unlocked) {
    res.status(404).json({ error: "No lockout record found for this email" });
    return;
  }
  console.info("[admin] manual unlock", { email: req.params.email, by: req.authUser.id });
  res.status(200).json({ ok: true });
});
