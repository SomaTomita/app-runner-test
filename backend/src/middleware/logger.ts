import { RequestHandler } from "express";
import crypto from "crypto";

export const logger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? "error" : "info",
      message: `${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - start,
      requestId,
      userAgent: req.get("user-agent") || "",
      ip: req.ip || "",
    };

    console.log(JSON.stringify(log));
  });

  next();
};
