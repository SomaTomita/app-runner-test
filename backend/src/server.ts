import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

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
