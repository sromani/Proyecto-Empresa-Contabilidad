import { normalizarDatabaseUrlParaApp } from "@/lib/database-url";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function opcionesPrismaClient(): ConstructorParameters<typeof PrismaClient>[0] {
  const url = process.env.DATABASE_URL;
  const base: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
  if (url) {
    base.datasources = {
      db: { url: normalizarDatabaseUrlParaApp(url) },
    };
  }
  return base;
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(opcionesPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
