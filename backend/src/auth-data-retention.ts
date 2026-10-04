import type { PrismaClient } from '@prisma/client'

export async function cleanupStaleAuthRecords(prisma: PrismaClient, now = new Date()) {
  const [sessions, accountTokens] = await prisma.$transaction([
    prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { revokedAt: { not: null } },
        ],
      },
    }),
    prisma.accountToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { consumedAt: { not: null } },
        ],
      },
    }),
  ])

  return { sessions: sessions.count, accountTokens: accountTokens.count }
}
