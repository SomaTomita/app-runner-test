import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("@clerk/express", () => ({
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma";
import usersRouter from "./users";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);
app.use(errorHandler);

const mockUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Users routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("returns user list", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser]);

      const res = await request(app).get("/api/users");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].email).toBe("test@example.com");
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns a user by id", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const res = await request(app).get("/api/users/1");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test User");
    });

    it("returns 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app).get("/api/users/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("POST /api/users", () => {
    it("creates a user", async () => {
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/users")
        .send({ email: "test@example.com", name: "Test User" });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("test@example.com");
    });

    it("returns 400 for invalid data", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ email: "invalid", name: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("updates a user", async () => {
      const updated = { ...mockUser, name: "Updated" };
      vi.mocked(prisma.user.update).mockResolvedValue(updated);

      const res = await request(app)
        .put("/api/users/1")
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("deletes a user", async () => {
      vi.mocked(prisma.user.delete).mockResolvedValue(mockUser);

      const res = await request(app).delete("/api/users/1");

      expect(res.status).toBe(204);
    });
  });
});
