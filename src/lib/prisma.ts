import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { existsSync } from "fs";
import path from "path";

const rootDbPath = path.resolve(process.cwd(), "dev.db");
const legacyPrismaDbPath = path.resolve(process.cwd(), "prisma/dev.db");
const configuredDbPath = process.env.SQLITE_DB_PATH
  ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
  : null;

const dbPath = configuredDbPath ?? (existsSync(rootDbPath) ? rootDbPath : legacyPrismaDbPath);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
