import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";

const mockQueryRaw = vi.fn();

vi.mock("../lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

import healthRouter from "./health";

const app = express();
app.use("/api/health", healthRouter);

describe("GET /api/health", () => {
  it("returns status ok when DB is healthy", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });

  it("returns 503 when DB is unavailable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
    expect(res.body.timestamp).toBeDefined();
  });
});
