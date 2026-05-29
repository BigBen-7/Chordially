import express, { type Express } from "express";
import { z } from "zod";

import { env } from "./env.js";
import {
  getUserById,
  listUsers,
  loginUser,
  logoutUser,
  logoutAllSessions,
  registerUser,
  rotateRefreshToken,
  updateUserPassword,
} from "./auth-store.js";
import { requireAuth } from "./auth-middleware.js";
import { requireRole } from "./authz-middleware.js";
import { rateLimiters } from "./rate-limiter.js";
import { requestVerification, confirmVerification } from "./verification-store.js";
import { requestPasswordReset, consumeResetToken } from "./reset-store.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  origin: z.string().optional(),
});

const logoutSchema = z.object({ token: z.string().min(1) });

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: env.APP_NAME });
  });

  app.get("/api/v1/meta", (_req, res) => {
    res.json({ app: "Chordially", phase: "hackathon-starter", currentMilestone: "authentication" });
  });

  app.get("/api/v1/auth/users", (_req, res) => {
    res.json({ users: listUsers() });
  });

  // #320 – opaque duplicate-account response; #321 – rate-limited
  app.post("/api/v1/auth/register", rateLimiters.register, (req, res) => {
    const payload = registerSchema.parse(req.body);
    try {
      const user = registerUser(payload);
      res.status(201).json({ message: "Registration starter flow completed.", user });
    } catch {
      // Opaque response: do not reveal whether the account exists.
      res.status(409).json({ error: "REGISTRATION_FAILED", message: "Unable to complete registration." });
    }
  });

  // #321 – rate-limited
  app.post("/api/v1/auth/login", rateLimiters.login, (req, res) => {
    const payload = loginSchema.parse(req.body);
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const { session, refreshToken } = loginUser({ ...payload, ip, userAgent });
    // Redact telemetry from the response; it is stored server-side only.
    const { ip: _ip, userAgent: _ua, ...safeSession } = session;
    res.status(200).json({ message: "Login starter flow completed.", session: safeSession, refreshToken });
  });

  // #318 – single-session logout: revokes only the supplied token
  app.post("/api/v1/auth/logout", (req, res) => {
    const { token } = logoutSchema.parse(req.body);
    const revoked = logoutUser(token);
    res.status(200).json({
      message: revoked ? "Session revoked." : "Session was already absent.",
      sessionsRevoked: revoked ? 1 : 0,
    });
  });

  // #319 – global sign-out: revokes every active session for the authenticated user
  app.post("/api/v1/auth/logout-all", requireAuth, (req, res) => {
    const session = res.locals["session"] as import("@chordially/types").AuthSession;
    const count = logoutAllSessions(session.userId);
    res.status(200).json({
      message: "All sessions revoked.",
      sessionsRevoked: count,
    });
  });

  /**
   * GET /api/v1/auth/me
   * Returns the active contributor identity and session metadata.
   */
  app.get("/api/v1/auth/me", requireAuth, (req, res) => {
    const session = res.locals["session"] as import("@chordially/types").AuthSession;
    const user = getUserById(session.userId);
    if (!user) {
      res.status(401).json({ error: "INVALID_SESSION", message: "User not found." });
      return;
    }
    res.json({ user, session });
  });

  // #321 – rate-limited
  app.post("/api/v1/auth/refresh", rateLimiters.refresh, (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = rotateRefreshToken(refreshToken);
    res.json({ session: result.session, refreshToken: result.refreshToken });
  });

  // ── #323 – email verification ─────────────────────────────────────────────

  app.post("/api/v1/auth/verify/request", requireAuth, (req, res) => {
    const session = res.locals["session"] as import("@chordially/types").AuthSession;
    const user = getUserById(session.userId);
    if (!user) { res.status(401).json({ error: "INVALID_SESSION", message: "User not found." }); return; }
    requestVerification(user.id, user.email);
    res.json({ message: "Verification email queued." });
  });

  app.post("/api/v1/auth/verify/confirm", (req, res) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    try {
      const { email } = confirmVerification(token);
      res.json({ message: "Email verified.", email });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "TOKEN_INVALID";
      res.status(400).json({ error: code, message: (err as Error).message });
    }
  });

  // ── #324 – password reset ─────────────────────────────────────────────────

  app.post("/api/v1/auth/reset/request", (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    // Look up user; always return 200 to avoid email enumeration.
    const users = listUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (user) requestPasswordReset(user.id, user.email);
    res.json({ message: "If that email is registered, a reset link has been sent." });
  });

  app.post("/api/v1/auth/reset/complete", (req, res) => {
    const { token, password } = z.object({ token: z.string().min(1), password: z.string().min(8) }).parse(req.body);
    try {
      const { userId } = consumeResetToken(token);
      updateUserPassword(userId, password);
      logoutAllSessions(userId);
      res.json({ message: "Password updated. All sessions have been invalidated." });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "TOKEN_INVALID";
      res.status(400).json({ error: code, message: (err as Error).message });
    }
  });

  // ── #325 – role-protected example route ──────────────────────────────────

  app.get("/api/v1/admin/users", requireAuth, requireRole("admin"), (_req, res) => {
    res.json({ users: listUsers() });
  });

  return app;
}
