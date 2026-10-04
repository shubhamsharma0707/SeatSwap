import { createHmac } from 'node:crypto'
import type { FastifyRateLimitOptions, FastifyRateLimitStoreCtor } from '@fastify/rate-limit'
import { Prisma, type PrismaClient } from '@prisma/client'

type RateLimitCallback = (error: Error | null, result?: { current: number; ttl: number }) => void
type RouteStoreOptions = FastifyRateLimitOptions & {
  routeInfo?: { method?: string | string[]; url?: string }
}

class PostgresRateLimitStore {
  private readonly routeKey: string

  constructor(
    private readonly prisma: PrismaClient,
    private readonly keySecret: string,
    options: RateLimitOptions,
  ) {
    const routeInfo = (options as RouteStoreOptions).routeInfo
    const method = Array.isArray(routeInfo?.method) ? routeInfo.method.join(',') : routeInfo?.method
    this.routeKey = routeInfo ? `${method ?? 'UNKNOWN'}:${routeInfo.url ?? '/'}` : 'global'
  }

  incr(key: string, callback: RateLimitCallback, timeWindow: number, _max: number) {
    const keyHash = createHmac('sha256', this.keySecret)
      .update(`${this.routeKey}\u0000${key}`)
      .digest('hex')

    void this.prisma.$queryRaw<Array<{ current: number; ttl: number }>>(Prisma.sql`
      INSERT INTO "rate_limit_counters" ("key_hash", "request_count", "window_ends_at", "updated_at")
      VALUES (
        ${keyHash},
        1,
        NOW() + (${timeWindow} * INTERVAL '1 millisecond'),
        NOW()
      )
      ON CONFLICT ("key_hash") DO UPDATE SET
        "request_count" = CASE
          WHEN "rate_limit_counters"."window_ends_at" <= NOW() THEN 1
          ELSE "rate_limit_counters"."request_count" + 1
        END,
        "window_ends_at" = CASE
          WHEN "rate_limit_counters"."window_ends_at" <= NOW()
            THEN NOW() + (${timeWindow} * INTERVAL '1 millisecond')
          ELSE "rate_limit_counters"."window_ends_at"
        END,
        "updated_at" = NOW()
      RETURNING
        "request_count" AS "current",
        GREATEST(0, CEIL(EXTRACT(EPOCH FROM ("window_ends_at" - NOW())) * 1000))::integer AS "ttl"
    `).then(([result]) => {
      callback(null, result)
    }).catch((error: unknown) => {
      callback(error instanceof Error ? error : new Error('Rate-limit counter update failed'))
    })
  }

  child(routeOptions: RouteStoreOptions) {
    return new PostgresRateLimitStore(this.prisma, this.keySecret, routeOptions)
  }
}

type RateLimitOptions = ConstructorParameters<FastifyRateLimitStoreCtor>[0]

export function createPostgresRateLimitStore(prisma: PrismaClient, keySecret: string): FastifyRateLimitStoreCtor {
  return class extends PostgresRateLimitStore {
    constructor(options: RateLimitOptions) {
      super(prisma, keySecret, options)
    }
  }
}
