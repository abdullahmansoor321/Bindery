import { PrismaClient } from "@prisma/client";

// Prevents creating a new PrismaClient (and a new DB connection pool)
// on every hot-reload in development. In production this just runs once.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}