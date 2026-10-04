import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import type { Prisma, PrismaClient } from '@prisma/client'
import { config } from './config.js'

const transporter = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER && config.SMTP_PASSWORD
        ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
        : undefined,
    })
  : null

export const emailDeliveryConfigured = Boolean(transporter && config.EMAIL_FROM)

type EmailPayload = { to: string; subject: string; text: string }
const maxAttempts = 8
const staleLockMs = 5 * 60 * 1000

function encryptionKey() {
  const secret = config.EMAIL_ENCRYPTION_KEY ?? config.COOKIE_SIGNING_SECRET
  if (!secret) throw new Error('Email outbox encryption is not configured')
  return createHash('sha256').update(secret).digest()
}

function encryptPayload(payload: EmailPayload) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])
  return `v1.${[iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.')}`
}

function decryptPayload(value: string): EmailPayload {
  const [version, ivText, tagText, ciphertextText] = value.split('.')
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) throw new Error('Invalid encrypted email payload')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
  return JSON.parse(plaintext) as EmailPayload
}

export async function enqueueAccountEmail(
  transaction: Prisma.TransactionClient,
  payload: EmailPayload,
  expiresAt: Date,
) {
  await transaction.emailOutbox.create({
    data: { payloadEncrypted: encryptPayload(payload), expiresAt },
  })
}

export async function processEmailOutbox(
  prisma: PrismaClient,
  onDeliveryFailure: (outboxId: string, attempts: number) => void = () => undefined,
) {
  if (!transporter || !config.EMAIL_FROM) return

  const now = new Date()
  const staleBefore = new Date(now.getTime() - staleLockMs)
  await prisma.emailOutbox.updateMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING', 'FAILED'] },
      expiresAt: { lte: now },
    },
    data: { status: 'EXPIRED', lockedAt: null, lastErrorCode: 'message_expired' },
  })
  const eligible = await prisma.emailOutbox.findMany({
    where: {
      OR: [
        { status: 'PENDING', availableAt: { lte: now }, expiresAt: { gt: now } },
        { status: 'PROCESSING', lockedAt: { lt: staleBefore }, expiresAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  for (const message of eligible) {
    const claim = await prisma.emailOutbox.updateMany({
      where: {
        id: message.id,
        OR: [
          { status: 'PENDING', availableAt: { lte: now }, expiresAt: { gt: now } },
          { status: 'PROCESSING', lockedAt: { lt: staleBefore }, expiresAt: { gt: now } },
        ],
      },
      data: { status: 'PROCESSING', lockedAt: now, attempts: { increment: 1 } },
    })
    if (claim.count !== 1) continue

    const attempts = message.attempts + 1
    try {
      if (message.expiresAt <= new Date()) {
        await prisma.emailOutbox.update({
          where: { id: message.id },
          data: { status: 'EXPIRED', lockedAt: null, lastErrorCode: 'message_expired' },
        })
        continue
      }
      const payload = decryptPayload(message.payloadEncrypted)
      await transporter.sendMail({ from: config.EMAIL_FROM, ...payload })
      await prisma.emailOutbox.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date(), lockedAt: null, lastErrorCode: null },
      })
    } catch {
      const delayMs = Math.min(10_000 * (2 ** (attempts - 1)), 60 * 60 * 1000)
      await prisma.emailOutbox.update({
        where: { id: message.id },
        data: {
          status: message.expiresAt <= new Date()
            ? 'EXPIRED'
            : attempts >= maxAttempts
              ? 'FAILED'
              : 'PENDING',
          availableAt: new Date(Date.now() + delayMs),
          lockedAt: null,
          lastErrorCode: message.expiresAt <= new Date() ? 'message_expired' : 'delivery_failed',
        },
      })
      onDeliveryFailure(message.id, attempts)
    }
  }
}
