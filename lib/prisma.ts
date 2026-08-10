import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter at runtime — a bare
// connection string in schema.prisma is no longer enough on its own.
// This uses DATABASE_URL (the Transaction pooler, port 6543) since
// this is the runtime app connection, not the CLI/introspection one
// (which uses DIRECT_URL via prisma.config.ts instead).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}