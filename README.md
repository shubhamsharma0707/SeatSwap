# ⚡ SeatSwap™ — SaaS Seat Marketplace Prototype

> **A frontend prototype exploring a marketplace for provider-authorized team seats.**

## Project status

This repository is a UI prototype with an in-progress backend. The landing page and dashboard are static HTML; the catalog is illustrative and no real seat inventory exists. The account API uses PostgreSQL, encrypted transactional email outbox delivery, and server-managed sessions. Local signup, verification, login, profile, logout, and password-reset flows have been exercised with PostgreSQL and Mailpit. `server.js` serves pages and proxies `/api/v1/*` to the backend. There is no verified inventory, lease processing, payment processing, escrow, automated invitations, or access monitoring. Do not treat catalog cards or dashboard examples as real offers.

The proposed backend architecture, provider-policy gates, data model, and phased delivery plan are in [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md). Provider authorization and payment-provider approval must be established before real transactions or listings are built.

---

## 🌟 Overview

**SeatSwap** explores whether provider-authorized team-seat assignment can help organizations use eligible software capacity more efficiently. The current peer-to-peer leasing model is only a concept: provider permission, market demand, and payment approval have not been established. No seats are available through this site.

### ✨ Key Features

- **🛡️ Security concept**: The design explores provider-authorized invitations; no invite or relay integration is implemented.
- **🔒 Payment concept**: Escrow and refunds appear in prototype copy only; no money is collected or held.
- **⚡ Frontend prototype**: Landing page and dashboard with illustrative catalogs, example pricing calculators, and future-workflow scenarios.
- **🔑 Authentication**: React UI wired to API flows for registration, email verification, login, logout, profile updates, and password recovery. Requires PostgreSQL and SMTP configuration to operate.
- **🌐 Local development**: `server.js` serves the static site and proxies API requests; Fastify runs separately on port 4001 by default.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/shubhamsharma0707/SeatSwap.git
cd SeatSwap
```

### 2. Start the static prototype
```bash
npm start
```

### 3. Open in Browser
- **Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)
- **Landing Page**: [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Sign In / Sign Up UI**: [http://localhost:3000/login](http://localhost:3000/login)

This starts only the static site server. The landing page and illustrative dashboard render without the backend, but registration, sign-in, profile, and recovery need PostgreSQL, Mailpit (or SMTP), and the Fastify API. Follow [QUICKSTART.md](./QUICKSTART.md) to run the complete local account stack.

---

## 📂 Project Structure

```
SeatSwap/
├── index.html                   # Cinematic landing page
├── dashboard.html               # Main seat catalog & interactive leasing dashboard
├── server.js                    # Static file server and local API proxy
├── backend/                     # Fastify account API, PostgreSQL/Prisma schema and migrations
├── package.json                 # Project configuration & start scripts
├── .gitignore                   # Git ignore patterns
│
├── js/
│   └── integration.js           # Session API navigation, currency sync, modal state
│
├── auth-app/                    # React 18 + Tailwind CSS authentication app
│   ├── src/
│   │   ├── pages/               # Login, signup, verification, reset, account profile
│   │   ├── components/          # AuthLayout, UI inputs & buttons
│   │   └── App.tsx              # HashRouter route configuration
│   ├── dist/                    # Pre-built distribution bundle (ready-to-serve)
│   ├── vite.config.ts           # Vite configuration with relative base
│   └── package.json             # Auth dependencies & build scripts
│
├── BACKEND_ARCHITECTURE.md      # Current state, backend design, feasibility gates, and phases
├── ARCHITECTURE.md              # Product vision and prototype specification
└── QUICKSTART.md                # Local frontend demo guide
```

---

## 🛠️ Developing & Rebuilding Auth App

If you make modifications inside `auth-app/`:

```bash
cd auth-app
npm install
npm run build
```

The compiled bundle in `auth-app/dist/` will immediately be served by `server.js`.

---

## 🔐 Authentication status

There are no demo credentials. The API stores password hashes and server-side sessions, and the browser receives an HttpOnly cookie. Verification and reset messages are stored in an encrypted outbox before delivery; rate limits are shared across API processes through PostgreSQL. Local signup, email verification, login/session, profile update, logout, and password reset are implemented. Production email, deployment, and staging remain outstanding. See [QUICKSTART.md](./QUICKSTART.md) for local setup.

## Backend plan

Read [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) before implementing backend features. The project plan starts with provider, legal, payment, and market-fit feasibility, then builds identity, approved listings, lease/support workflows, and payments in gated phases.

The API is in `backend/`. Configure `backend/.env`, start the local containers with `docker compose up -d` from `backend/`, apply migrations with `npm run db:migrate`, then run the API with `npm run backend:dev` and the static server with `npm start`. This workspace has the migration applied and the account lifecycle has been exercised locally; marketplace actions remain disabled.

GitHub Actions is configured to apply migrations against an ephemeral PostgreSQL service, build the API and auth UI, build the API container, and syntax-check the static server. It does not run browser-level account flows or marketplace transaction checks.

---

## 📄 License

ISC License © 2026 SeatSwap
