import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const clerkEnabled =
  !!process.env.CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export const authMiddleware: RequestHandler = clerkEnabled
  ? (req, res, next) => {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const allowedIds = (process.env.ALLOWED_USER_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (!allowedIds.includes(userId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      next();
    }
  : isDev
    ? (_req, _res, next) => next()
    : (_req, res) => {
        res.status(503).json({ error: "Auth not configured" });
      };
