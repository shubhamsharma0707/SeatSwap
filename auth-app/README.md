# SeatSwap authentication UI

React 18, TypeScript, Vite, Tailwind CSS, and React Router pages for registration, login, email verification, and password recovery. Forms call the same-origin `/api/v1/auth/*` backend and use its HttpOnly session cookie.

## Local development

```bash
npm install
npm run dev
```

Vite runs on port 5173 and proxies `/api` to the SeatSwap static server on port 3000. Start that server and the backend API as described in the repository [QUICKSTART.md](../QUICKSTART.md). PostgreSQL and SMTP must be configured for account flows.

## Build

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/` and served by the repository's static server.

## Routes

- `/` and `/login` — sign-in
- `/signup` — account registration
- `/verify-email?token=…` — confirm email
- `/reset-password` — request password reset
- `/reset-password?token=…` — set a new password
- `/profile` — view account details and update the display name

The marketplace catalog and payment actions are not part of this UI's authenticated API yet.
