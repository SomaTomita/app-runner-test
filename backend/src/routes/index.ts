import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import imagesRouter from "./images";

const router = Router();

router.use("/health", healthRouter);
router.use("/users", usersRouter);
router.use("/images", imagesRouter);

export default router;
