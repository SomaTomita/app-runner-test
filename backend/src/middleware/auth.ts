import { requireAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const clerkEnabled =
  !!process.env.CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export const authMiddleware: RequestHandler = clerkEnabled
  ? requireAuth()
  : isDev
    ? (_req, _res, next) => next()
    : (_req, res) => {
        res.status(503).json({ error: "Auth not configured" });
      };
