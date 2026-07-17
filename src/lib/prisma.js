import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;
const prismaSchemaVersion = "2026-07-17-session-control-v1";

const createPrismaClient = () => new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Fast Refresh keeps globalThis alive. Couple the cached instance to a schema
// version so a generated client from an older schema is never reused.
export const prisma = globalForPrisma.prismaSchemaVersion === prismaSchemaVersion
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = prismaSchemaVersion;
}
