import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
});

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "info", "warn", "error"],
});
