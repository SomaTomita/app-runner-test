import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY ||
    !process.env.ALLOWED_USER_IDS?.trim())
) {
  console.error(
    "FATAL: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and ALLOWED_USER_IDS must be set in production",
  );
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Storage type: ${config.storageType}`);
});

function shutdown() {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
