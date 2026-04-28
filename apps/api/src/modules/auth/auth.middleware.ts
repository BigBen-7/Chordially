import type { NextFunction, Request, Response } from "express";
import { getUserById, isBanned } from "./auth.store.js";
import { verifyToken } from "./auth.tokens.js";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: ReturnType<typeof getUserById>;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length);
  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (isBanned(user.id)) {
    res.status(403).json({
      error: "account_banned",
      message: "Your account has been suspended. Contact support to appeal."
    });
    return;
  }

  req.authUser = user;
  next();
}
