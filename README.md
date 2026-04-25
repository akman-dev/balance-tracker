# BalTrack

Deployable Next.js balance timeline planner for Vercel.

BalTrack projects cash flow, recurring income, recurring bank withdrawals, credit-card float, due dates, discretionary budget room, and safe-to-invest cash above a reserve target.

## Stack

- Next.js App Router
- React
- Vercel Functions for account auth and `/api/plan`
- Neon/Postgres through `DATABASE_URL` or `POSTGRES_URL`
- HTTP-only session cookies
- Per-user cloud plan storage

## Data model

The web app stores users, sessions, and one normalized plan document per user:

- `baltrack_users`
- `baltrack_sessions`
- `baltrack_plans`

The API creates these tables automatically the first time a configured database is used.

## Account security

- Passwords are hashed with scrypt and per-user salts.
- Session cookies are HTTP-only, SameSite=Lax, and Secure in production.
- API responses containing account or plan data are marked `Cache-Control: no-store`.
- Plans are keyed by authenticated `user_id`; there is no shared global plan document.
- Registration is open to anyone with access to the deployed app.

## Local Development

Use the repo Node version:

```bash
source ~/.nvm/nvm.sh
nvm use
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Without `DATABASE_URL` or `POSTGRES_URL`, the app will show the sign-in screen but refuse account operations because secure cloud storage is required.

## Vercel

Create/deploy the Vercel project from this repo, attach a Neon/Postgres database integration, and set the production domain to:

```text
baltrack.akmanapps.com
```

The build command is:

```bash
npm run build
```

The output is the standard Next.js Vercel deployment.
