import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Default user ID for single-user setup (can be made dynamic later)
export const DEFAULT_USER_ID = 'default-user';

// Initialize default user if not exists
export async function initializeDefaultUser() {
  try {
    const user = await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: 'user@aiworkspace.com',
        name: 'AI Workspace User',
      },
    });
    console.log('✅ Default user initialized:', user.email);
  } catch (error) {
    console.error('❌ Error initializing default user:', error);
  }
}

