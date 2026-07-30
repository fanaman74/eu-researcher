/**
 * Safe PrismaClient singleton (Prisma 7 + pg driver adapter).
 *
 * Prisma 7 requires a driver adapter: `new PrismaClient()` without one throws.
 * We construct the client lazily through `getPrisma()` so that:
 *  - the app builds and runs fine when DATABASE_URL is not configured
 *    (callers fall back to in-memory storage),
 *  - dev hot-reloads do not leak connections.
 *
 * Returns `null` (logging a single warning) when DATABASE_URL is unset.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

let warnedMissingUrl = false;

export function getPrisma(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  // Treat unset, placeholder (e.g. copied from .env.example), or non-postgres
  // URLs as "not configured" and fall back to in-memory storage. A well-formed
  // but unreachable URL still fails loudly at query time (real outage).
  const isPlaceholder =
    !connectionString ||
    connectionString.includes("[YOUR_") ||
    !/^postgres(ql)?:\/\//i.test(connectionString);
  if (isPlaceholder) {
    if (!warnedMissingUrl) {
      console.warn(
        "[db] DATABASE_URL is not set or is a placeholder — database features are disabled (in-memory fallback active)."
      );
      warnedMissingUrl = true;
    }
    return null;
  }

  if (!globalForPrisma.prismaClient) {
    const adapter = new PrismaPg({ connectionString });
    globalForPrisma.prismaClient = new PrismaClient({ adapter });
  }
  return globalForPrisma.prismaClient;
}
