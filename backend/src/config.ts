import 'dotenv/config'
import { z } from 'zod'

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  DATABASE_URL: z.string().url().optional(),
  APP_BASE_URL: z.string().url().default('http://localhost:3000/auth-app/dist/index.html'),
  COOKIE_SIGNING_SECRET: z.string().min(32).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_ENCRYPTION_KEY: z.string().min(32).optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return

  const appBaseUrl = new URL(value.APP_BASE_URL)
  if (appBaseUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(appBaseUrl.hostname)) {
    context.addIssue({
      code: 'custom',
      path: ['APP_BASE_URL'],
      message: 'APP_BASE_URL must be a public HTTPS URL in production',
    })
  }

  for (const key of ['DATABASE_URL', 'COOKIE_SIGNING_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM', 'EMAIL_ENCRYPTION_KEY'] as const) {
    if (!value[key]) {
      context.addIssue({ code: 'custom', path: [key], message: `${key} is required in production` })
    }
  }
})

const result = environmentSchema.safeParse(process.env)

if (!result.success) {
  throw new Error(`Invalid backend configuration: ${z.prettifyError(result.error)}`)
}

export const config = result.data
