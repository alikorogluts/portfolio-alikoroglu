import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPgPool?: Pool;
  prismaPgPoolErrorListenerAttached?: boolean;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma Client.");
}

const pool = (globalForPrisma.prismaPgPool ??= new Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
}));

if (!globalForPrisma.prismaPgPoolErrorListenerAttached) {
  pool.on("error", (error) => {
    console.error("[prisma] Idle database connection error.", error);
  });
  globalForPrisma.prismaPgPoolErrorListenerAttached = true;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??= new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export function isTransientDatabaseError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    code === "P1001" ||
    code === "ECONNRESET" ||
    message.includes("server has closed the connection") ||
    message.includes("connection terminated") ||
    message.includes("connection closed") ||
    message.includes("closed the connection") ||
    message.includes("can't reach database server")
  );
}

export async function readWithRetry<T>(operation: () => Promise<T>, label = "database read") {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDatabaseError(error)) {
      throw error;
    }

    console.warn(`[prisma] Transient ${label} failure; retrying once.`, error);
    await new Promise((resolve) => setTimeout(resolve, 150));
    return operation();
  }
}
