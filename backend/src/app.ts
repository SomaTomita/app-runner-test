import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { config } from "./config";
import { corsMiddleware } from "./middleware/cors";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(logger);
app.use(clerkMiddleware());

if (config.storageType === "local") {
  app.use("/static/images", express.static(config.localImageDir));
}

app.use("/api", routes);
app.use(errorHandler);

export default app;
