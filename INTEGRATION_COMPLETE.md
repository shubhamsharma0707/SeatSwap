# SeatSwap integration status

The original mock authentication integration has been replaced with calls to the new `/api/v1/auth/*` API. This document tracks the current boundary; “integrated” means UI-to-API wiring, not that the service is operational in this environment.

## Implemented

- Landing and dashboard pages use the backend session endpoint to show account navigation. Direct `/dashboard.html` visits redirect unauthenticated visitors to sign-in; `/` serves the fictional, read-only dashboard prototype for preview.
- React auth UI calls API routes for registration, login, email verification, password-reset requests, and password-reset confirmation.
- The API hashes passwords with Argon2id, stores only hashed session and one-time tokens, uses signed HttpOnly cookies, issues expiring single-use email tokens, rate-limits auth routes, and protects writes with CSRF tokens.
- Password reset revokes the account's existing sessions.
- Browser code no longer treats localStorage mock tokens as authentication.
- Account settings can read the authenticated profile and update the display name through ownership-checked API routes.
- Verification and reset messages enter an encrypted, transactional PostgreSQL outbox. Delivery is retried with capped backoff; local recovery was verified across a Mailpit outage.
- Outbox messages carry the matching token expiry, are not sent after expiry, and sent/expired encrypted payloads have bounded retention. A ticketed CLI command supports operator requeue for unexpired terminal failures.

## Required configuration

PostgreSQL and SMTP must be configured for account flows. Set the variables in `backend/.env.example`, apply Prisma migrations, and run both the static server and API. Production configuration also requires HTTPS and persistent cookie-signing and email-encryption secrets. The API readiness endpoint requires database and email transport configuration.

This workspace has PostgreSQL and Mailpit running locally. All committed migrations were applied to the working database; the API image was built and its readiness check passed. The first three migrations were applied to a clean database. Signup, verification, login/session, profile update, logout, and password reset were exercised against the local stack. A forced Mailpit outage confirmed that a queued message was delivered after service recovery. This is local validation, not production or staging evidence. CI is configured to apply migrations to an ephemeral PostgreSQL service, but the GitHub workflow has not yet run.

## Not implemented

Seat inventory, approved product listings, leases, payment capture or payout, escrow, provider invitations, access probes, disputes, and admin moderation remain out of scope until their Phase 0 gates are satisfied. Dashboard transactions remain disabled and are explicitly labeled as prototype content.
