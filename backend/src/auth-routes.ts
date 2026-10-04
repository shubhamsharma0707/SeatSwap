import { createHash, randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { Prisma, PrismaClient, AccountTokenPurpose } from '@prisma/client'
import { z } from 'zod'
import { config } from './config.js'
import { emailDeliveryConfigured, enqueueAccountEmail } from './email.js'

const SESSION_COOKIE = config.NODE_ENV === 'production' ? '__Host-seatswap_session' : 'seatswap_session'
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000
const REMEMBERED_SESSION_LIFETIME_MS = 30 * SESSION_LIFETIME_MS
const VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000
const RESET_LIFETIME_MS = 60 * 60 * 1000
const dummyPasswordHash = argon2.hash(randomBytes(32), { type: argon2.argon2id })
const authRateLimit = { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }

const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().default(false),
})

const emailSchema = z.object({ email: z.string().trim().email().max(320) })
const profileSchema = z.object({ fullName: z.string().trim().min(1).max(120) })
const tokenSchema = z.object({ token: z.string().min(32).max(256) })
const resetSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(128),
})

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function recordAuditEvent(
  transaction: Prisma.TransactionClient,
  request: FastifyRequest,
  actorId: string,
  action: string,
  objectType: string,
  objectId: string,
) {
  await transaction.auditEvent.create({
    data: { actorId, action, objectType, objectId, requestId: request.id },
  })
}

function accountUrl(path: string, token: string) {
  const url = new URL(config.APP_BASE_URL)
  url.hash = `/${path}?token=${encodeURIComponent(token)}`
  return url.toString()
}

function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    signed: true,
    expires: expiresAt,
  })
}

function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

async function issueAccountToken(
  transaction: Prisma.TransactionClient,
  userId: string,
  purpose: AccountTokenPurpose,
  lifetimeMs: number,
) {
  const rawToken = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + lifetimeMs)
  await transaction.accountToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      purpose,
      expiresAt,
    },
  })
  return { rawToken, expiresAt }
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown, reply: FastifyReply): T | null {
  const result = schema.safeParse(body)
  if (!result.success) {
    reply.code(400).send({ error: 'invalid_request', message: 'Please check the submitted details.' })
    return null
  }
  return result.data
}

async function resolveSession(prisma: PrismaClient, request: FastifyRequest) {
  const cookie = request.cookies[SESSION_COOKIE]
  if (!cookie) return null

  const { valid, value } = request.unsignCookie(cookie)
  if (!valid || !value) return null

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(value),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { status: 'ACTIVE', emailVerifiedAt: { not: null } },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: { select: { id: true, email: true, displayName: true } },
    },
  })
  return session
}

export function registerAuthRoutes(app: FastifyInstance, prisma: PrismaClient | null) {
  app.get('/api/v1/auth/csrf', async (_request, reply) => ({ token: await reply.generateCsrf() }))

  app.post('/api/v1/auth/signup', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    if (!emailDeliveryConfigured) return reply.code(503).send({ error: 'email_unavailable', message: 'Email delivery must be configured before accounts can be created.' })
    const input = parseBody(signUpSchema, request.body, reply)
    if (!input) return

    const email = input.email.toLowerCase()
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id })
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return reply.code(202).send({ message: 'If the address is eligible, a verification email will be sent. If you already have an account, sign in.' })
    }

    try {
      await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: { email, displayName: input.fullName, passwordHash },
          select: { id: true, email: true },
        })
        await recordAuditEvent(transaction, request, user.id, 'account.created', 'user', user.id)
        const token = await issueAccountToken(transaction, user.id, 'EMAIL_VERIFICATION', VERIFICATION_LIFETIME_MS)
        await enqueueAccountEmail(transaction, {
          to: user.email,
          subject: 'Verify your SeatSwap email',
          text: `Use this link within 24 hours to verify your email: ${accountUrl('verify-email', token.rawToken)}`,
        }, token.expiresAt)
      })
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return reply.code(202).send({ message: 'If the address is eligible, a verification email will be sent. If you already have an account, sign in.' })
      }
      throw error
    }

    return reply.code(202).send({ message: 'If the address is eligible, a verification email will be sent. If you already have an account, sign in.' })
  })

  app.post('/api/v1/auth/email-verification', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    if (!emailDeliveryConfigured) return reply.code(503).send({ error: 'email_unavailable', message: 'Email delivery is not configured.' })
    const input = parseBody(emailSchema, request.body, reply)
    if (!input) return
    const genericResponse = { message: 'If the address needs verification, a new link will be sent.' }
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (!user || user.status !== 'PENDING_VERIFICATION') return reply.send(genericResponse)

    await prisma.$transaction(async (transaction) => {
      const token = await issueAccountToken(transaction, user.id, 'EMAIL_VERIFICATION', VERIFICATION_LIFETIME_MS)
      await enqueueAccountEmail(transaction, {
        to: user.email,
        subject: 'Verify your SeatSwap email',
        text: `Use this link within 24 hours to verify your email: ${accountUrl('verify-email', token.rawToken)}`,
      }, token.expiresAt)
    })
    return reply.send(genericResponse)
  })

  app.post('/api/v1/auth/email-verification/confirm', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const input = parseBody(tokenSchema, request.body, reply)
    if (!input) return
    const token = await prisma.accountToken.findFirst({
      where: { tokenHash: hashToken(input.token), purpose: 'EMAIL_VERIFICATION', consumedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    })
    if (!token) return reply.code(400).send({ error: 'invalid_token', message: 'This verification link is invalid or expired.' })

    const confirmed = await prisma.$transaction(async (tx) => {
      const consumedAt = new Date()
      const consumed = await tx.accountToken.updateMany({
        where: { id: token.id, purpose: 'EMAIL_VERIFICATION', consumedAt: null, expiresAt: { gt: consumedAt } },
        data: { consumedAt },
      })
      if (consumed.count !== 1) return false
      await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date(), status: 'ACTIVE' } })
      await recordAuditEvent(tx, request, token.userId, 'account.email_verified', 'user', token.userId)
      return true
    })
    if (!confirmed) return reply.code(400).send({ error: 'invalid_token', message: 'This verification link is invalid or expired.' })
    return reply.send({ message: 'Email verified. You can now sign in.' })
  })

  app.post('/api/v1/auth/login', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const input = parseBody(loginSchema, request.body, reply)
    if (!input) return
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    const passwordHash = user?.passwordHash ?? await dummyPasswordHash
    const validPassword = await argon2.verify(passwordHash, input.password).catch(() => false)
    if (!user || !validPassword || user.status !== 'ACTIVE' || !user.emailVerifiedAt) {
      return reply.code(401).send({ error: 'invalid_credentials', message: 'Email or password is incorrect, or the account is not verified.' })
    }

    const rawSession = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + (input.rememberMe ? REMEMBERED_SESSION_LIFETIME_MS : SESSION_LIFETIME_MS))
    await prisma.$transaction(async (transaction) => {
      const session = await transaction.session.create({
        data: { userId: user.id, tokenHash: hashToken(rawSession), expiresAt },
        select: { id: true },
      })
      await recordAuditEvent(transaction, request, user.id, 'auth.session_created', 'session', session.id)
    })
    setSessionCookie(reply, rawSession, expiresAt)
    return reply.send({ user: { id: user.id, email: user.email, fullName: user.displayName } })
  })

  app.get('/api/v1/auth/session', async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const session = await resolveSession(prisma, request)
    if (!session) return reply.code(401).send({ error: 'unauthenticated', message: 'Sign in to continue.' })
    return reply.send({ user: { id: session.user.id, email: session.user.email, fullName: session.user.displayName } })
  })

  app.get('/api/v1/account/me', async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const session = await resolveSession(prisma, request)
    if (!session) return reply.code(401).send({ error: 'unauthenticated', message: 'Sign in to continue.' })
    return reply.send({
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.displayName,
      },
    })
  })

  app.patch('/api/v1/account/me', { onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const session = await resolveSession(prisma, request)
    if (!session) return reply.code(401).send({ error: 'unauthenticated', message: 'Sign in to continue.' })
    const input = parseBody(profileSchema, request.body, reply)
    if (!input) return
    const user = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id: session.userId },
        data: { displayName: input.fullName },
        select: { id: true, email: true, displayName: true },
      })
      await recordAuditEvent(transaction, request, session.userId, 'account.profile_updated', 'user', session.userId)
      return updatedUser
    })
    return reply.send({ user: { id: user.id, email: user.email, fullName: user.displayName } })
  })

  app.post('/api/v1/auth/logout', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (prisma) {
      const session = await resolveSession(prisma, request)
      if (session) {
        await prisma.$transaction(async (transaction) => {
          await transaction.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
          await recordAuditEvent(transaction, request, session.userId, 'auth.session_revoked', 'session', session.id)
        })
      }
    }
    clearSessionCookie(reply)
    return reply.send({ message: 'Signed out.' })
  })

  app.post('/api/v1/auth/password-reset', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    if (!emailDeliveryConfigured) return reply.code(503).send({ error: 'email_unavailable', message: 'Email delivery is not configured.' })
    const input = parseBody(emailSchema, request.body, reply)
    if (!input) return
    const genericResponse = { message: 'If an account exists for this address, a password reset link will be sent.' }
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, select: { id: true, email: true, status: true } })
    if (!user || user.status !== 'ACTIVE') return reply.send(genericResponse)

    await prisma.$transaction(async (transaction) => {
      const token = await issueAccountToken(transaction, user.id, 'PASSWORD_RESET', RESET_LIFETIME_MS)
      await enqueueAccountEmail(transaction, {
        to: user.email,
        subject: 'Reset your SeatSwap password',
        text: `Use this link within one hour to reset your password: ${accountUrl('reset-password', token.rawToken)}`,
      }, token.expiresAt)
    })
    return reply.send(genericResponse)
  })

  app.post('/api/v1/auth/password-reset/confirm', { ...authRateLimit, onRequest: app.csrfProtection }, async (request, reply) => {
    if (!prisma) return reply.code(503).send({ error: 'service_unavailable', message: 'Account service is not configured.' })
    const input = parseBody(resetSchema, request.body, reply)
    if (!input) return
    const token = await prisma.accountToken.findFirst({
      where: { tokenHash: hashToken(input.token), purpose: 'PASSWORD_RESET', consumedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    })
    if (!token) return reply.code(400).send({ error: 'invalid_token', message: 'This reset link is invalid or expired.' })

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id })
    const changed = await prisma.$transaction(async (tx) => {
      const consumedAt = new Date()
      const consumed = await tx.accountToken.updateMany({
        where: { id: token.id, purpose: 'PASSWORD_RESET', consumedAt: null, expiresAt: { gt: consumedAt } },
        data: { consumedAt },
      })
      if (consumed.count !== 1) return false
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } })
      await tx.accountToken.updateMany({
        where: { userId: token.userId, purpose: 'PASSWORD_RESET', consumedAt: null },
        data: { consumedAt: new Date() },
      })
      await tx.session.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } })
      await recordAuditEvent(tx, request, token.userId, 'account.password_reset', 'user', token.userId)
      return true
    })
    if (!changed) return reply.code(400).send({ error: 'invalid_token', message: 'This reset link is invalid or expired.' })
    clearSessionCookie(reply)
    return reply.send({ message: 'Password updated. Sign in with your new password.' })
  })
}
