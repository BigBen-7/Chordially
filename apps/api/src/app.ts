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
} from "./auth-store.js";
import { requireAuth } from "./auth-middleware.js";
import { rateLimiters } from "./rate-limiter.js";

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
    const { session, refreshToken } = loginUser(payload);
    res.status(200).json({ message: "Login starter flow completed.", session, refreshToken });
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

  return app;
}
