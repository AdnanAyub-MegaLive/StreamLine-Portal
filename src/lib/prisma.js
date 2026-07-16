import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const createPrismaClient = () => new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Next.js Fast Refresh can retain a client generated from an older schema.
// Replace it when a newly added model is not available on the cached instance.
export const prisma = globalForPrisma.prisma?.auditLog
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
