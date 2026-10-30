import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const { getAuth } = vi.hoisted(() => ({ getAuth: vi.fn() }));
vi.mock("@clerk/express", () => ({ getAuth }));

async function testApp() {
  const { authMiddleware } = await import("./auth");
  const app = express();
  app.get("/protected", authMiddleware, (_req, res) => res.json({ ok: true }));
  return app;
}

describe("API access restrictions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "test-public-config");
    vi.stubEnv("CLERK_SECRET_KEY", "test-server-config");
    vi.stubEnv("ALLOWED_USER_IDS", "user_allowed, user_other");
    getAuth.mockReturnValue({ userId: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 401 instead of redirecting an unauthenticated API caller", async () => {
    const res = await request(await testApp()).get("/protected");
    expect(res.status).toBe(401);
    expect(res.headers.location).toBeUndefined();
  });

  it("denies a signed-in user outside the allowlist", async () => {
    getAuth.mockReturnValue({ userId: "user_unlisted" });
    expect((await request(await testApp()).get("/protected")).status).toBe(403);
  });

  it("accepts an explicitly allowed user and trims allowlist whitespace", async () => {
    getAuth.mockReturnValue({ userId: "user_other" });
    expect((await request(await testApp()).get("/protected")).status).toBe(200);
  });

  it("denies access when the allowlist is empty", async () => {
    vi.stubEnv("ALLOWED_USER_IDS", "");
    getAuth.mockReturnValue({ userId: "user_allowed" });
    expect((await request(await testApp()).get("/protected")).status).toBe(403);
  });

  it("fails closed when production auth configuration is missing", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    expect((await request(await testApp()).get("/protected")).status).toBe(503);
  });

  it("permits the local development bypass only without Clerk keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    expect((await request(await testApp()).get("/protected")).status).toBe(200);
  });
});
