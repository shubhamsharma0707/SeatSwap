# SeatSwap local development

SeatSwap is a prototype. The catalog and pricing are hard-coded examples. Implemented backend flows cover account registration, email verification, login/session, profile update, logout, and password reset. Listings, seat assignment, payments, escrow, monitoring, and disputes are not implemented.

## Run the frontend

From the repository root:

```bash
npm start
```

Open `http://localhost:3000/index.html`. The static server binds to loopback by default; the optional mirror listener is disabled unless `SECONDARY_PORT` is set. The static landing page works by itself; account features need the API and its database/email dependencies. The root URL `/` serves the fictional, read-only dashboard prototype for preview. Visiting `/dashboard.html` directly redirects to sign-in without a valid account session. For a container behind a reverse proxy, set `STATIC_HOST=0.0.0.0` and keep the public traffic behind the proxy's TLS termination.

## Run the API

1. Install the API dependencies with `cd backend && npm install`.
2. Copy `.env.example` to `.env` and set a unique `COOKIE_SIGNING_SECRET` and `EMAIL_ENCRYPTION_KEY` for this local environment.
3. From `backend/`, start the local PostgreSQL and Mailpit services with `docker compose up -d`.
4. Run `npm run db:generate`, then `npm run db:migrate`.
5. In one terminal, start the API with `npm run dev`. In a second terminal from the repository root, run `npm start`.

Local verification emails appear in the Mailpit inbox at `http://localhost:8025`. The Compose services bind to loopback and use development-only credentials. For a non-Docker setup, provide a PostgreSQL database and SMTP server through `.env` instead.

Alternatively, from the repository root, `npm run backend:dev` starts the API. The static server proxies `/api/v1/*` to API port 4001. `GET /api/v1/health/live` checks that the process responds; `GET /api/v1/health/ready` also requires PostgreSQL and email delivery configuration. If port 3000 is already in use, start the static server with `PORT=3110 npm start` and set `APP_BASE_URL=http://localhost:3110/auth-app/dist/index.html` in `backend/.env` so email links return to the right local site.

The production API image can be built with `docker build -t seatswap-api:local backend`. It runs as a non-root user and exposes port 4001. Production deployment still needs TLS termination, production secrets, a managed PostgreSQL database, and a controlled migration step; the image does not run migrations automatically.

Account registration and password recovery require PostgreSQL and SMTP. The local Compose setup provides PostgreSQL and Mailpit; without database and email configuration, authentication requests return an unavailable response. No demo password or localStorage token grants access.

## Rebuild the authentication UI

```bash
cd auth-app
npm install
npm run build
```

The generated bundle is served from `auth-app/dist/`.

## Product boundary

Do not publish listings or accept payments based on the dashboard examples. Read the provider policy screen and Phase 0 exit gate in [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) before implementing marketplace transactions.

For migration, backup, and recovery procedures, see [backend/OPERATIONS.md](./backend/OPERATIONS.md).
