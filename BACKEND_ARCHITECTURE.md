# SeatSwap Backend Architecture

**Status:** In progress; local Phase 1 foundation and Phase 2 account lifecycle validated. Phase 0 product approval and production/staging gates remain.  
**Updated:** 2026-10-04

## 1. What exists today

SeatSwap remains a frontend prototype with an in-progress account backend:

- `server.js` serves the two public HTML pages and frontend assets on a configured port, binding to loopback by default; an optional second listener requires explicit configuration. It proxies `/api/v1/*` to the backend service. It does not serve backend source, secrets, or project files. `/index.html` is the landing page; `/` serves the fictional dashboard preview, while direct `/dashboard.html` visits require a session.
- `dashboard.html` contains a hard-coded example catalog and pricing calculators. It now labels sample prices and host data as fictional and describes unresolved provider, payment, and support requirements. Lease confirmation is disabled; no real listings or telemetry exist.
- `auth-app/` is a React/Vite UI wired to signup, verification, login, session, and password recovery routes.
- `backend/` contains Fastify auth routes, Prisma migrations, Argon2id password hashing, CSRF, PostgreSQL-backed shared rate limits, an encrypted email outbox, and signed HttpOnly sessions.
- A local PostgreSQL/Mailpit stack is configured and all current migrations are applied. Signup, email verification, login/session, profile update, logout, and password-reset flows have been exercised locally. The API process runs the email-outbox worker. No managed production database, separate job runner, payment integration, or provider integration is configured.

The existing `ARCHITECTURE.md` is a product vision and a target-state sketch. Its escrow, automated invitations, health probes, security guarantees, and payout flows have not been implemented or validated.

## 2. Product and feasibility decision

The current concept should not launch as an open marketplace that rents arbitrary third-party software seats. Provider authorization is a prerequisite for each catalog product and seat type. For example, Figma's current Terms of Service for Starter and Professional plans restrict reselling, sublicensing, renting, or otherwise allowing third parties to access or use the service, subject to express authorization; Figma has a separate Organization/Enterprise agreement that must be reviewed for those plans. OpenAI says individual accounts are for the person who created them and that others should create their own accounts; that individual-account rule does not answer what a business workspace permits. Stripe lists escrow services as restricted and requires due diligence; Stripe Connect is a marketplace payment product, not a promise that this business model will be approved.

So this can help people only where the seat assignment is expressly allowed by the provider and the host has authority to assign it. It will not work for every user or every SaaS product. Before accepting money or advertising access, SeatSwap must verify terms for each provider/plan, get legal review for the target countries, and obtain written payment-provider approval for the actual flow. If those gates fail, pivot the affected product to provider-approved bulk buying, referral, or official reseller paths. Do not build credential sharing, OAuth/session relays, or automated provider-account control.

Sources checked 2026-10-04:

- [Figma Terms of Service](https://www.figma.com/legal/tos/)
- [Adobe General Terms of Use](https://www.adobe.com/legal/terms.html)
- [Canva Terms of Use](https://www.canva.com/policies/terms-of-use/)
- [LeetCode Terms of Service](https://leetcode.com/terms/)
- [Midjourney Terms of Service](https://docs.midjourney.com/docs/terms-of-service)
- [OpenAI Account Sharing Policy](https://help.openai.com/en/articles/10471989)
- [Stripe Restricted Businesses](https://stripe.com/legal/restricted-businesses)
- [Stripe Connect for marketplaces](https://stripe.com/connect/marketplaces)

This is product-planning guidance, not a legal determination. Enterprise agreements and provider-specific plans can differ, so review the exact agreement before listing a product.

### Initial policy screen for the current dashboard catalog

This is a stop/go screen, not permission to list. The default for every product is **do not list** until the precise plan's written terms and SeatSwap's intended assignment model have been reviewed.

| Catalog item | Public terms signal | Initial decision |
|---|---|---|
| Figma | Starter/Professional terms restrict resale, sublicensing, renting, and third-party access. Organization/Enterprise uses a different agreement. | Hold; review the exact Organization/Enterprise agreement and get permission for the marketplace use. |
| Adobe Creative Cloud | General terms prohibit resale, sublicensing, and third-party service access; business entitlements have a business-user context. | Hold; confirm the exact Teams/Enterprise seat eligibility and external contractor assignment in writing. |
| LeetCode Premium | Terms say use is for the user's sole benefit and prohibit allowing third parties to use the account; no multi-user Premium seat model is established by this review. | Exclude account-based sharing; revisit only with a provider-authorized product. |
| Midjourney | Terms say one user per account and explicitly prohibit resale of service or access. | Exclude account-based sharing; revisit only with explicit written authorization or an official multi-user product. |
| Canva Teams | Terms allow team plans but restrict making the service available to third parties except where terms permit; team content can be controlled by administrators. | Hold; verify who can receive seats, commercial assignment rights, and data/content consequences. |
| ChatGPT Team/Business | Individual accounts are for the account creator. This review did not establish permission to resell business workspace memberships. | Hold; individual-account sharing is out, and workspace resale requires explicit review/approval. |

The clearest product direction may be an **authorized group-buying or official partner marketplace**, where each participant owns an eligible seat from the provider, rather than leasing access from unrelated hosts. Test that alternative with buyers and providers before optimizing around “idle seat” supply.

## 3. Recommended system shape

Start with a **modular monolith**, one deployable API and one PostgreSQL database. This fits the existing small team and early product uncertainty. Keep modules separate in code; split services only when operational needs justify it.

```text
Browser
  ├── Landing page: index.html
  ├── Marketplace UI: dashboard.html (migrate incrementally)
  └── Auth UI: auth-app (React/Vite)
          │ HTTPS, same-origin /api
          ▼
Node.js + TypeScript API (Fastify)
  ├── Auth and sessions
  ├── User profiles and verification
  ├── Provider/product policy registry
  ├── Listings and seat inventory
  ├── Lease state machine
  ├── Payments and refunds (disabled until approved)
  ├── Support and disputes
  ├── Audit events and admin actions
  └── Webhook and scheduled-job handlers
          │
          ├── PostgreSQL (managed; Supabase-hosted Postgres is a reasonable MVP option)
          ├── Email provider (verification and transactional messages)
          ├── Payment marketplace product (only after written approval)
          └── Job runner (add when reminders/probes have an approved source)
```

### Stack choices

- **API:** Node.js + TypeScript + Fastify. It stays in the JavaScript ecosystem already used by the project and gives the API a clear schema/validation boundary.
- **Database:** PostgreSQL. It handles relational ownership, inventory counts, payment records, and transactional lease transitions.
- **Data layer:** Prisma migrations and typed queries. Keep database access inside modules; never let browser code connect with privileged credentials.
- **Identity:** Server-managed sessions in `HttpOnly`, `Secure`, `SameSite` cookies. Store only a hash of opaque session tokens in PostgreSQL. This avoids putting bearer credentials in `localStorage` and gives one auth model to both current frontends.
- **Email:** Transactional email provider for verification and recovery. Password reset responses must not reveal whether an email exists.
- **Email delivery:** Store encrypted message payloads in a PostgreSQL outbox in the same transaction as account tokens. A bounded worker retries delivery; keep the encryption key in the secret manager and do not log recipient/token contents.
- **Rate limiting:** Use a PostgreSQL atomic upsert keyed by an HMAC of route and client IP so multiple API processes share counters without storing raw IPs. Add a dedicated cache only if measured request volume makes database counters a bottleneck.
- **Payments:** No escrow promise in the first release. If the model is authorized, use an approved marketplace payment flow (evaluate Stripe Connect or a locally available equivalent) and let the provider control settlement. Do not pool seller funds in SeatSwap's own account or describe delayed payout as legally compliant escrow without approval.
- **Hosting:** Deploy the static site and API under one origin where practical. Use a managed Postgres service with backups. Keep secrets in deployment environment configuration, never in frontend bundles or committed files.
- **Jobs:** Start with database-backed scheduled tasks or a managed scheduler only for actions with a reliable, approved data source. Add a queue such as BullMQ/Redis only when retries and volume make it useful.

The static HTML does not need a wholesale rewrite. Move data-dependent behavior to API calls in small slices. The React auth app can remain separate while calling same-origin `/api` endpoints.

## 4. Domain model

Use UUID primary keys, UTC timestamps, foreign keys, database constraints, and soft deletion only where retention policy requires it. Monetary values are integer minor units plus ISO currency; never floating point.

| Table | Purpose / key fields |
|---|---|
| `users` | email (normalized, unique), display name, status, verification timestamps, created/updated timestamps |
| `sessions` | user ID, hashed token, expiry, last-used, revoked timestamp |
| `account_tokens` | user ID, hashed one-time verification/reset token, purpose, expiry, consumed timestamp |
| `email_outbox` | AES-GCM encrypted message payload, retry state/attempt count, next attempt, lock and sent timestamps; excludes plaintext recipient and link token |
| `rate_limit_counters` | HMAC-keyed route/client counters and fixed-window expiration shared by API instances; expired rows are periodically deleted |
| `provider_products` | provider, product/plan, policy review status, permitted assignment model, evidence URL, reviewer, reviewed/expiry dates |
| `listings` | host ID, product ID, price/currency, quantity, assignment evidence, state, moderation fields |
| `listing_inventory` | listing ID, unit state; transactional reservation prevents overselling |
| `leases` | listing/unit, buyer and host IDs, term, price snapshot, state, cancellation/dispute timestamps |
| `payment_records` | lease ID, payment-provider IDs, amount/currency, state, fee snapshot; no card data |
| `webhook_events` | provider/event ID unique key, received/processed state, safe payload reference for idempotency |
| `disputes` | lease ID, reporter, reason, evidence metadata, resolution and timestamps |
| `audit_events` | actor, action, object, timestamp, request correlation ID; append-only application events |

Avoid storing provider passwords, access tokens, invite secrets, buyer work files, or unnecessary identity documents. Collect the minimum evidence needed to establish that a host can lawfully assign a seat, and define deletion/retention rules before collecting it.

## 5. API boundary

Version routes from the beginning under `/api/v1`. Validate input on the server, derive user identity from the session, and authorize every record by ownership and state. The browser never supplies the host/buyer identity as authority.

Initial route families:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`, `POST /auth/password-reset`, `POST /auth/email-verification`
- `GET /account/me`, `PATCH /account/me` for the authenticated user's own profile
- `GET /products` and `GET /listings` (only approved/active catalog entries)
- `POST /host/listings`, `PATCH /host/listings/:id`, `GET /host/listings`
- `POST /leases`, `GET /leases`, `POST /leases/:id/cancel`
- `POST /leases/:id/disputes`, `GET /support/disputes/:id`
- `POST /webhooks/:provider` with provider signature verification and idempotency
- Admin-only routes for provider policy reviews, listing moderation, and dispute decisions

All state-changing operations must be transactional and idempotent where clients or webhooks can retry. Return generic errors to users and structured request IDs for support. Enforce rate limits on auth and recovery routes.

## 6. Lease lifecycle

Treat the lease as an explicit state machine, not as a UI modal or an escrow boolean:

```text
draft → pending_host_acceptance → pending_payment → active → completed
                 │                    │             ├→ cancelled
                 └→ expired            └→ failed    └→ disputed → resolved/refunded
```

Only the server can make transitions. Inventory reservation, lease creation, and payment intent creation must be coordinated so seats cannot be double-booked. The exact transition into `active`, refund rules, settlement delay, and cancellation policy depend on the provider's seat process and payment-provider approval. Do not claim automatic access monitoring unless an authorized API or reliable webhook exists for that product.

## 7. Security and operations baseline

- HTTPS only in deployed environments; secure cookies, CSRF defenses for cookie-authenticated writes, strict CORS, and a restrictive Content Security Policy.
- Password hashing with Argon2id (or use a managed identity provider if the team does not want to operate password security); email verification and expiring, single-use reset tokens.
- Server-side authorization for every private read and write; database constraints for unique email, inventory, and webhook idempotency.
- Request validation, rate limits, generic authentication errors, secret rotation, dependency updates, and sanitized logs.
- No secrets, raw payment data, or session tokens in logs. Store audit trails for money and moderation actions.
- Backups with a tested restore procedure, error monitoring, health/readiness endpoints, and a documented incident contact path before accepting users.
- Admin functions require strong authentication, role checks, and audit records.

## 8. Phased delivery plan and gates

### Phase 0 — Product and policy validation (now)

Create a product-by-product policy matrix for the exact seller, plan, buyer, country, and seat assignment model. Confirm provider permission, legal/payment feasibility, and a real access verification method. Interview both hosts and buyers to establish that the permitted model solves a real problem. No money, real credentials, or production listings in this phase.

**Exit gate:** At least one provider/plan has documented permission for the proposed assignment, legal review covers the launch market, and a payment provider confirms the proposed marketplace flow can be onboarded.

### Phase 1 — Backend foundation (local runtime validated; staging pending)

The repository now has a separate TypeScript/Fastify API in `backend/`, Prisma schema and migrations, environment validation, redacted request logging, liveness/readiness endpoints, graceful SIGINT/SIGTERM shutdown, and a local same-origin `/api/v1` proxy in `server.js`. `backend/compose.yaml` runs loopback-only PostgreSQL and Mailpit services for local development. All four migrations are applied to the local database; the first three were also applied to a clean database. `backend/Dockerfile` builds a non-root production API image; the image was built and run against the local database and SMTP sink, and its readiness/health checks passed. A local custom-format database dump was restored into an isolated database and checked. CI is configured to apply migrations against ephemeral PostgreSQL, build the API, auth UI, and production API image, and check static JavaScript syntax. The API is intentionally not wired to demo transaction behavior. Remaining Phase 1 work is deployment configuration, validation of the selected provider's production backup/restore controls, and a staging environment before any user data is involved. See `backend/OPERATIONS.md` for the tested local restore procedure and production operational gates.

**Exit gate:** repeatable local setup and deployment, migration/back-up plan, and operational health visibility.

### Phase 2 — Real identity and profiles (local lifecycle validated; production hardening pending)

Implemented source includes signup, email verification and resend, login, logout, session lookup, password reset, and reset confirmation. Passwords use Argon2id; raw session and one-time tokens are not stored in the database; browser sessions use signed HttpOnly cookies; writes require CSRF tokens and auth endpoints are rate-limited. UI no longer treats localStorage tokens as authentication. The schema and migration include sessions and account tokens.

The account lifecycle was exercised against the local PostgreSQL/Mailpit stack: signup, delivered verification email, verification, login, session lookup, profile read/update, logout revocation, reset email, password update, rejection of the old password, and login with the new password all passed. Verification and reset messages are enqueued in the same database transaction as their account tokens. The outbox payload is AES-256-GCM encrypted, expired links are not sent, and sent/expired payloads have bounded retention. Expired/revoked sessions and consumed/expired account tokens are removed at startup and daily. Successful account creation, verification, session creation/revocation, profile updates, and password resets also write minimal audit events transactionally; production audit retention must be defined for the launch country. After Mailpit was stopped, a signup message remained queued after a failed delivery attempt and was delivered after Mailpit restarted. Rate limits use shared PostgreSQL counters; six login attempts split across two API processes produced five authentication responses followed by a shared 429 limit. A fresh verification email link also resolved to the configured local site port. Production monitoring for terminal email failures, production configuration, and staging verification are still required.

**Exit gate:** account lifecycle works end-to-end with server-side authorization and recovery email.

### Phase 3 — Approved listings and inventory

Implement provider registry, moderated host verification, listing CRUD, inventory transactions, catalog search/filter, and server-owned prices. Keep the catalog read-only until a product's policy gate is approved.

**Exit gate:** no overselling; every active listing maps to a currently approved product/assignment model.

### Phase 4 — Lease and support workflow (no automatic money holding)

Implement lease requests, host acceptance, invitation/delivery confirmation supported by the approved provider workflow, cancellations, disputes, support tools, and audit records. Start with manual operations where provider integrations do not exist.

**Exit gate:** end-to-end delivery and support process works with real hosts/buyers in a closed pilot without making unsupported automation claims.

### Phase 5 — Payments and payouts

Only after written approvals, integrate marketplace payment onboarding, identity/KYC requirements, payment webhooks, fee calculation, refunds, reconciliation, and payout reporting. Use payment-provider terminology accurately; do not label the flow escrow unless the provider and counsel approve that characterization.

**Exit gate:** test-mode reconciliation, refunds, disputes, and payout ownership are reviewed; provider approves production activation.

### Phase 6 — Scale and automation

Add provider APIs/webhooks, health checks, queue workers, automated risk signals, analytics, and additional regions only where the provider authorizes the data access and automated action. Keep human review for access, fraud, and money disputes until false-positive rates are known.

**Exit gate:** measured reliability and support capacity justify each automation.

## 9. Immediate implementation boundary

The backend foundation and account lifecycle now run locally, but staging/deployment and operational recovery are not complete. Phase 0's permission and market-fit gate must happen before transactions, payment capture, invites, access proxies, or probes. Marketplace content remains illustrative and transaction actions are disabled.
