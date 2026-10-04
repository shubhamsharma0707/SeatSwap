FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

# Prisma reads the datasource URL while generating its client, but no database
# connection is made during the image build. The runtime stage does not inherit it.
ENV DATABASE_URL=postgresql://seatswap:build-only@127.0.0.1:5432/seatswap?schema=public

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run db:generate \
    && npm run build \
    && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4001
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4001/api/v1/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]
