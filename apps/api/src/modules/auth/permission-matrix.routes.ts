/**
 * CHORD-107 – Permission matrix API route.
 *
 * GET /auth/permissions  – returns the resolved permission map for the
 * authenticated user. Requires a valid Bearer token.
 */

import { Router } from "express";
import { requireAuth } from "./auth.middleware.js";
import { resolvePermissions } from "./permission-matrix.js";

export const permissionMatrixRouter = Router();

permissionMatrixRouter.get("/permissions", requireAuth, (req, res) => {
  const user = req.authUser!;

  const permissions = resolvePermissions({ role: user.role });

  console.info("[permissions] resolved", { userId: user.id, role: user.role });

  res.status(200).json({ userId: user.id, role: user.role, permissions });
});
