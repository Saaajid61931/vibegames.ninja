# VibeGames Infrastructure Reference

This file is the single reference for what services VibeGames uses and where each environment variable should be set.

## 1) What services are used

- App runtime: Next.js
- Database: Supabase PostgreSQL
- File storage for uploaded games/thumbnails: Cloudflare R2
- Authentication: NextAuth
- Hosting: choose one
  - Vercel, or
  - Cloudflare Workers (OpenNext)

Do not try to manage both Vercel and Cloudflare for the same live environment unless you intentionally maintain two deployments.

## 2) DATABASE_URL vs DIRECT_URL (simple explanation)

- `DATABASE_URL`
  - Used by the running app for normal queries.
  - For Supabase, this is usually the pooled/pgbouncer URL (often port `6543`).
- `DIRECT_URL`
  - Used by Prisma CLI commands (`prisma db push`, migrations).
  - For Supabase, this is the direct connection URL (usually port `5432`).

Where to find both in Supabase:

1. Supabase dashboard
2. Project Settings -> Database
3. Connection string section
4. Copy pooled URL into `DATABASE_URL`
5. Copy direct URL into `DIRECT_URL`

## 3) Where to set environment variables

- Local dev: `.env`
- Vercel deploy: Vercel Project -> Settings -> Environment Variables
- Cloudflare deploy: Workers & Pages -> Your project -> Settings -> Variables / Secrets

Important: `.env.production` is only a local reference file unless you explicitly load it yourself.
Your real deployed app uses env vars from your hosting platform dashboard.

## 4) Required environment variables

Copy from `.env.example` and fill values.

Required for core app:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL`

Required for uploads (game upload fails without these):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

Optional:

- `AUTH_TRUST_HOST`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `CRON_SECRET`

## 5) One-time setup checklist (new environment)

1. Set all env vars in the target environment (local, Vercel, or Cloudflare).
2. Run:

```bash
npx prisma db push
```

3. Restart app/deployment.
4. Test login.
5. Test studio profile creation (admin only).
6. Test upload with a tiny `.html` file.

## 6) Quick diagnostics

Run these from repo root:

```bash
npx prisma db push
npx tsc --noEmit
```

If upload fails, check server/API response text. Common messages:

- `DB_SCHEMA_MISMATCH`
  - DB schema does not match Prisma schema.
  - Run `npx prisma db push` against the same DB your app uses.
- `R2 upload failed. Verify R2 credentials and bucket permissions.`
  - One or more R2 values are wrong, missing, or token lacks write access.
- `AUTHENTICATION_REQUIRED`
  - Not logged in (or bad session).
- `FORBIDDEN`
  - Action requires admin role.

## 7) Admin-only studio profiles

Studio profile creation is intentionally admin-only.

To verify a user role in DB:

```bash
npx tsx -e "import prisma from './src/lib/prisma'; const u=await prisma.user.findUnique({where:{email:'YOUR_EMAIL'},select:{email:true,role:true}}); console.log(u); await prisma.$disconnect();"
```

To promote user to admin:

```bash
echo "UPDATE \"User\" SET role='ADMIN' WHERE email='YOUR_EMAIL';" | npx prisma db execute --stdin --schema prisma/schema.prisma
```

## 8) Recommended operating model

- Keep one source of truth per environment:
  - one DB
  - one host
  - one set of env vars
- After schema changes, always run `npx prisma db push` before testing uploads.
