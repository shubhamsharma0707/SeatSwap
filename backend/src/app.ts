import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import csrfProtection from '@fastify/csrf-protection'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { createPostgresRateLimitStore } from './rate-limit-store.js'
import { cleanupStaleAuthRecords } from './auth-data-retention.js'
import { registerAuthRoutes } from './auth-routes.js'
import { config } from './config.js'
import { emailDeliveryConfigured, processEmailOutbox } from './email.js'

export function createApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: ['req.headers.cookie', 'req.headers.authorization'],
    },
    trustProxy: config.NODE_ENV === 'production',
  })

  const prisma = config.DATABASE_URL ? new PrismaClient() : null
  const authDataRetentionTimer = prisma
    ? setInterval(() => {
        void cleanupStaleAuthRecords(prisma).then(({ sessions, accountTokens }) => {
          if (sessions || accountTokens) {
            app.log.info({ sessions, accountTokens }, 'Removed expired authentication records')
          }
        }).catch((error) => {
          const errorName = error instanceof Error ? error.name : 'UnknownError'
          app.log.error({ errorName }, 'Authentication record retention cleanup failed')
        })
      }, 24 * 60 * 60 * 1000)
    : null
  authDataRetentionTimer?.unref()
  if (prisma) {
    void cleanupStaleAuthRecords(prisma).then(({ sessions, accountTokens }) => {
      if (sessions || accountTokens) {
        app.log.info({ sessions, accountTokens }, 'Removed expired authentication records')
      }
    }).catch((error) => {
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      app.log.error({ errorName }, 'Authentication record retention cleanup failed')
    })
  }
  const emailOutboxTimer = prisma && emailDeliveryConfigured
    ? setInterval(() => {
        void processEmailOutbox(prisma, (outboxId, attempts) => {
          app.log.warn({ outboxId, attempts }, 'Account email delivery attempt failed')
        }).catch((error) => {
          const errorName = error instanceof Error ? error.name : 'UnknownError'
          app.log.error({ errorName }, 'Email outbox worker failed')
        })
      }, 5_000)
    : null
  emailOutboxTimer?.unref()
  const rateLimitCleanupTimer = prisma
    ? setInterval(() => {
        void prisma.rateLimitCounter.deleteMany({ where: { windowEndsAt: { lt: new Date() } } }).catch((error) => {
          const errorName = error instanceof Error ? error.name : 'UnknownError'
          app.log.error({ errorName }, 'Rate-limit counter cleanup failed')
        })
      }, 15 * 60 * 1000)
    : null
  rateLimitCleanupTimer?.unref()
  const emailOutboxRetentionTimer = prisma
    ? setInterval(() => {
        const now = new Date()
        const sentBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const expiredBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        void prisma.emailOutbox.deleteMany({
          where: {
            OR: [
              { status: 'SENT', sentAt: { lt: sentBefore } },
              { status: 'EXPIRED', createdAt: { lt: expiredBefore } },
            ],
          },
        }).catch((error) => {
          const errorName = error instanceof Error ? error.name : 'UnknownError'
          app.log.error({ errorName }, 'Email outbox retention cleanup failed')
        })
      }, 24 * 60 * 60 * 1000)
    : null
  emailOutboxRetentionTimer?.unref()

  app.register(helmet)
  app.register(cookie, {
    secret: config.COOKIE_SIGNING_SECRET ?? randomBytes(32).toString('hex'),
  })
  app.register(csrfProtection, {
    cookieKey: config.NODE_ENV === 'production' ? '__Host-seatswap_csrf' : 'seatswap_csrf',
    cookieOpts: {
      signed: true,
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 60,
    },
    getToken: (request) => request.headers['x-csrf-token'] as string | undefined,
  })
  app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    ...(prisma ? {
      store: createPostgresRateLimitStore(
        prisma,
        config.COOKIE_SIGNING_SECRET ?? 'development-only-rate-limit-key',
      ),
    } : {}),
  })

  app.setErrorHandler((error, request, reply) => {
    const statusValue = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined
    const statusCode = typeof statusValue === 'number' && statusValue >= 400 && statusValue < 600
      ? statusValue
      : 500
    if (statusCode >= 500) {
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      const errorCode = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : undefined
      app.log.error({ requestId: request.id, errorName, errorCode }, 'API request failed')
    }
    const safeResponse = statusCode === 429
      ? { error: 'rate_limited', message: 'Too many requests. Please try again shortly.' }
      : statusCode === 404
        ? { error: 'not_found', message: 'The requested resource was not found.' }
      : statusCode === 403
        ? { error: 'request_rejected', message: 'This request could not be verified.' }
        : statusCode === 400
          ? { error: 'invalid_request', message: 'Please check the submitted details.' }
          : { error: 'internal_error', message: 'The request could not be completed.' }
    return reply.code(statusCode).send(safeResponse)
  })

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store')
  })

  app.get('/api/v1/health/live', async () => ({ status: 'ok' }))

  app.get('/api/v1/health/ready', async (_request, reply) => {
    if (!prisma) {
      return reply.code(503).send({ status: 'not_ready', database: 'not_configured' })
    }

    try {
      await prisma.$queryRaw`SELECT 1`
      if (!emailDeliveryConfigured) {
        return reply.code(503).send({ status: 'not_ready', database: 'ok', email: 'not_configured' })
      }
      return { status: 'ready', database: 'ok', email: 'configured' }
    } catch (error) {
      app.log.error('Database readiness check failed')
      return reply.code(503).send({ status: 'not_ready', database: 'unavailable' })
    }
  })

  app.register(async (authApp) => {
    registerAuthRoutes(authApp, prisma)
  })

  app.addHook('onClose', async () => {
    if (authDataRetentionTimer) clearInterval(authDataRetentionTimer)
    if (emailOutboxTimer) clearInterval(emailOutboxTimer)
    if (rateLimitCleanupTimer) clearInterval(rateLimitCleanupTimer)
    if (emailOutboxRetentionTimer) clearInterval(emailOutboxRetentionTimer)
    await prisma?.$disconnect()
  })

  return app
}
