# Authentication UI implementation notes

The authentication UI is wired to `backend/` API routes. It does not issue or store browser bearer tokens. Session state is held in an HttpOnly cookie set by the API.

## Routes

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/email-verification` and `/email-verification/confirm`
- `POST /api/v1/auth/login`, `GET /api/v1/auth/session`, `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password-reset` and `/password-reset/confirm`
- `GET /api/v1/auth/csrf` supplies a CSRF token for writes

`src/lib/api.ts` fetches a CSRF token and sends it with each state-changing request. The Vite dev server proxies `/api` through the local static server to the backend.

## Operational requirements

The API needs PostgreSQL and a valid `DATABASE_URL`. Registration and recovery also need SMTP configuration. Until those are set and the migration is applied, account requests are expected to fail as unavailable. Email verification is required before sign-in.

Passwords require 12 or more characters in both the UI and API. Verification links expire after 24 hours; reset links expire after one hour. Password reset revokes active sessions.

## Build

From `auth-app/`, run `npm install` and `npm run build`. The generated app is served from `auth-app/dist/`.
