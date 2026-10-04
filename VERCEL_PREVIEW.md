# Vercel frontend preview

The root `vercel.json` deploys a static preview of the public website. The build copies only `index.html`, `dashboard.html`, `js/integration.js`, and the built auth UI into `vercel-preview/`; backend source, environment files, database configuration, and local development files are excluded.

The root URL opens the landing page, and `/dashboard.html` opens the fictional dashboard preview. Auth screens are included for visual review, but account actions are deliberately disabled because the backend is not part of this deployment. Marketplace actions remain unavailable.

Build locally with:

```sh
npm run build:vercel-preview
```

This deployment is for frontend review only. It does not deploy the Fastify API, PostgreSQL, email service, or background workers. Do not configure production user accounts or use this preview for real transactions.
