import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;
const prismaSchemaVersion = "2026-07-17-management-modules-v3";
const requiredUserFields = ["sessionVersion", "forcedLogoutAt", "passwordHash", "deletedAt"];

const createPrismaClient = () => new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const cachedUserFields = globalForPrisma.prisma?._runtimeDataModel?.models?.User?.fields?.map((field) => field.name) ?? [];
const cachedClientMatchesSchema = globalForPrisma.prismaSchemaVersion === prismaSchemaVersion
  && requiredUserFields.every((field) => cachedUserFields.includes(field))
  && ["userAlbumItem","specialIdAssignment","gameLog","liveSession","talentPerformance","talentViolation"].every((model)=>Boolean(globalForPrisma.prisma?.[model]));

// Fast Refresh keeps globalThis alive. Reuse only a client that contains every
// field required by the current application schema.
export const prisma = cachedClientMatchesSchema
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = prismaSchemaVersion;
}
