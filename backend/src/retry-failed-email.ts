import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const outboxId = z.string().uuid().safeParse(process.argv[2])
const ticket = z.string().trim().min(1).max(80).safeParse(process.env.OPERATOR_TICKET)

if (!outboxId.success || !ticket.success) {
  process.stderr.write('Usage: OPERATOR_TICKET=<ticket-reference> npm run email:retry-failed -- <outbox-uuid>\n')
  process.exitCode = 2
} else {
  const prisma = new PrismaClient()
  try {
    const result = await prisma.emailOutbox.updateMany({
      where: {
        id: outboxId.data,
        status: 'FAILED',
        expiresAt: { gt: new Date() },
      },
      data: {
        status: 'PENDING',
        attempts: 0,
        manualRetryCount: { increment: 1 },
        availableAt: new Date(),
        lockedAt: null,
        lastErrorCode: 'manual_retry',
      },
    })

    if (result.count !== 1) {
      process.stderr.write('No unexpired failed message matched that ID.\n')
      process.exitCode = 1
    } else {
      process.stdout.write(`${JSON.stringify({ action: 'requeued', outboxId: outboxId.data, ticket: ticket.data })}\n`)
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    process.stderr.write(`Requeue failed (${errorName}).\n`)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
