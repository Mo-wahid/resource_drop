import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Tell Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    // During Vercel's static build phase, DATABASE_URL is undefined.
    // Return a dummy Proxy so imports don't crash the build.
    return new Proxy({}, { get: () => () => Promise.resolve([]) }) as unknown as PrismaClient;
  }
  
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
