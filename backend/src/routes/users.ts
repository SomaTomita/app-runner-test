import { Router } from "express";
import { z } from "zod";
import { UserService } from "../services/UserService";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const userService = new UserService(prisma);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
});

router.use(authMiddleware);

router.get("/", async (_req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await userService.findById(Number(req.params.id));
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.create(data);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.update(Number(req.params.id), data);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await userService.delete(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
