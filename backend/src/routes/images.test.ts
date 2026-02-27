import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";

const { mockListImagesWithUrls, mockGetImageUrl } = vi.hoisted(() => ({
  mockListImagesWithUrls: vi.fn(),
  mockGetImageUrl: vi.fn(),
}));

vi.mock("@clerk/express", () => ({
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../services/storage", () => ({
  createStorageService: () => ({
    listImagesWithUrls: mockListImagesWithUrls,
    getImageUrl: mockGetImageUrl,
  }),
}));

import imagesRouter from "./images";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use("/api/images", imagesRouter);
app.use(errorHandler);

describe("Images routes", () => {
  describe("GET /api/images", () => {
    it("returns image list with urls", async () => {
      mockListImagesWithUrls.mockResolvedValue([
        {
          key: "photo.jpg",
          name: "photo.jpg",
          size: 1024,
          url: "http://localhost:3000/static/images/photo.jpg",
        },
      ]);

      const res = await request(app).get("/api/images");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].key).toBe("photo.jpg");
      expect(res.body[0].url).toContain("photo.jpg");
    });

    it("returns empty array when no images", async () => {
      mockListImagesWithUrls.mockResolvedValue([]);

      const res = await request(app).get("/api/images");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /api/images/:key", () => {
    it("returns image URL", async () => {
      mockGetImageUrl.mockResolvedValue("http://localhost:3000/static/images/photo.jpg");

      const res = await request(app).get("/api/images/photo.jpg");

      expect(res.status).toBe(200);
      expect(res.body.url).toContain("photo.jpg");
    });
  });
});
