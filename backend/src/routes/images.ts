import { Router } from "express";
import { createStorageService } from "../services/storage";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const storageService = createStorageService();

router.use(authMiddleware);

router.get("/", async (_req, res, next) => {
  try {
    const images = await storageService.listImages();
    res.json(images);
  } catch (err) {
    next(err);
  }
});

router.get("/:key", async (req, res, next) => {
  try {
    const url = await storageService.getImageUrl(req.params.key);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
