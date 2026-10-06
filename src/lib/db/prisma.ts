// Prisma Client Singleton with Neon connection resilience
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientInstance: PrismaClient | null | undefined;
}

export function getPrisma(): PrismaClient | null {
  if (typeof window !== 'undefined') return null;
  if (!process.env.DATABASE_URL) return null;

  if (globalThis.prismaClientInstance !== undefined) {
    return globalThis.prismaClientInstance;
  }

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prismaClientInstance = client;
    }
    return client;
  } catch (e) {
    console.warn('Failed to initialize PrismaClient:', e);
    return null;
  }
}
