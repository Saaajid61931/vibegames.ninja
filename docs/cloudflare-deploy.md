# Cloudflare Deployment Runbook

Use this guide to deploy VibeGames globally on Cloudflare Workers with PostgreSQL + R2.

## 0) Important: Use Workers Builds, not next-on-pages

If you see errors like "routes were not configured to run with the Edge Runtime", you are using `@cloudflare/next-on-pages`.

This app uses Prisma and Node runtime APIs, so deploy with OpenNext:

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`

Do **not** use `npx @cloudflare/next-on-pages@1`.

## 1) Prepare GitHub repo

1. Create a new private GitHub repo.
2. Add remote and push:

```bash
git remote add origin <your-repo-url>
git branch -M main
git add .
git commit -m "prepare cloudflare-ready deployment"
git push -u origin main
```

## 2) Provision production database (PostgreSQL)

Recommended providers: Neon, Supabase, Railway, AWS RDS.

1. Create database.
2. Copy connection string.
3. Set both URLs in your deployment environment:
   - `DATABASE_URL`: pooling endpoint (usually `:6543`)
   - `DIRECT_URL`: direct/session endpoint for Prisma CLI (usually `:5432`)

## 3) Create Cloudflare R2 bucket

1. In Cloudflare Dashboard -> R2 -> Create bucket (example: `vibegames-assets`).
2. Generate **R2 API token** with read/write for this bucket.
3. Configure a public domain for the bucket (example: `assets.vibegames.ninja`).

Environment values needed:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL` (e.g. `https://assets.vibegames.ninja`)

## 4) Create a Cloudflare Worker project with Git integration

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Workers.
2. Connect your GitHub repository.
3. Build settings:
   - Build command: `npx @opennextjs/cloudflare build`
   - Deploy command: `npx @opennextjs/cloudflare deploy`
4. Keep Node.js compatibility enabled via `wrangler.jsonc` (`nodejs_compat` flag is already configured in this repo).
5. Ensure worker name matches `wrangler.jsonc` (`vibegames`) or update both `name` and `services[0].service` there.

## 5) Set app env variables in Cloudflare

Set these in your Cloudflare project:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_TRUST_HOST`
- `NEXT_PUBLIC_APP_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `CRON_SECRET`
- (optional) OAuth vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## 6) Apply Prisma schema

Run once against production DB:

```bash
npx prisma db push
```

## 7) Configure optional scheduled tasks

If you use scheduled jobs in your deployment, keep them non-destructive and scoped to analytics/reporting workflows.

## 8) DNS and domain

1. Set `vibegames.ninja` as primary domain.
2. Redirect secondary domains (e.g. `vibegames.in`) with 301 to primary.
3. Keep TLS enabled and always use HTTPS.

## 9) Post-deploy validation checklist

1. Register/login works.
2. Upload `.html` game works.
3. Upload `.zip` game with nested assets works.
4. Thumbnail renders in game cards.
5. Game opens from R2 URL in play page.
6. Optional scheduled jobs run successfully.
