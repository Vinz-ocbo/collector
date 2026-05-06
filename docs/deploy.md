# Deployment guide

This guide walks through deploying the app **for free** with the smallest
possible setup. The recommended combo is:

- **Frontend** on **Vercel** (Vite SPA, static)
- **Backend** on **Render** in **proxy-only mode** (no Postgres needed)

The backend has two modes — see [`CLAUDE.md`](../CLAUDE.md) section "Backend
(Fastify + Postgres)". For personal use, **proxy-only mode is enough**:
search hits Scryfall live with rate limiting + LRU cache. The DB-cached
mode (with bulk-ingest) is only worth setting up once you outgrow the free
Render tier or want offline-tolerant lookups.

The optional **DB-cached upgrade** and **Supabase auth** sections at the
bottom show how to add those without changing code.

---

## 1. Backend on Render (proxy-only mode)

### One-time setup

1. Sign up at <https://render.com> (no credit card required for the free tier).
2. **New → Web Service** → connect this GitHub repo.
3. Configure:
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm run start`
   - **Plan** : Free
4. Add the environment variables below (Settings → Environment).
5. Click **Create Web Service**. First deploy takes ~3 min.
6. Note the assigned URL — it looks like `https://tcg-collector-api.onrender.com`.

### Required environment variables

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Disables the dev-only Swagger UI and pretty logging |
| `LOG_LEVEL` | `info` | Or `warn` if logs feel chatty |
| `CORS_ORIGINS` | `https://<your-vercel-url>` | Comma-separated. Add your Vercel deploy URL once it exists. Wildcards are not supported — keep it explicit. |
| `SCRYFALL_USER_AGENT` | `TCGCollector/0.1.0 (contact: <your-email>)` | Scryfall asks every client to identify itself with a contact address |
| `SCRYFALL_RATE_LIMIT_PER_SECOND` | `8` | Default; Scryfall caps at 10 |

**Do not set** `DATABASE_URL` or `ADMIN_TOKEN` — leaving them empty keeps the
backend in proxy-only mode and disables the admin routes (no admin token
to leak).

### Free-tier behaviour

- The service **sleeps after 15 min of inactivity**.
- First request after sleep wakes it up — expect a **~30 s cold start**.
- Subsequent requests are fast.
- No persistent disk; everything is in-memory.

This is acceptable for personal use. If you find the cold start annoying,
the cheapest paid plan ($7/mo) keeps it always-on.

### Verify the backend works

Once Render says "Live":

```sh
curl https://<your-render-url>/health
# → {"status":"ok",...}

curl "https://<your-render-url>/v1/cards/search?q=lightning+bolt&limit=1"
# → {"cards":[...],"total":...}
```

If search returns results, the proxy is wired correctly.

---

## 2. Frontend on Vercel

### One-time setup

1. Sign up at <https://vercel.com>.
2. **New Project** → Import this repo.
3. Vercel auto-detects Vite. Confirm:
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`
4. Add the environment variables below (Project Settings → Environment Variables).
5. Click **Deploy**. First build takes ~2 min.

### Required environment variables

| Key | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-url>` | The Render URL from step 1. **No trailing slash.** |

### Optional environment variables

| Key | Value | When |
|---|---|---|
| `VITE_SENTRY_DSN` | `https://<key>@<org>.ingest.sentry.io/<project>` | If you create a Sentry project for this app — `initSentry()` no-ops without it |
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` | See section 4 below |
| `VITE_SUPABASE_ANON_KEY` | `eyJ…` | See section 4 below |
| `VITE_APP_VERSION` | `0.1.0` | Tagged on Sentry events for release-tracking |

### After deploy

Vercel assigns a URL like `https://tcg-collector-vinz.vercel.app`. Two
follow-up steps:

1. **Add this URL to the backend's CORS_ORIGINS** (Render → Settings →
   Environment) and redeploy the backend, otherwise browser requests get
   blocked.
2. **Smoke-test** the deployed frontend:
   - Open `/auth/signup`, create an account (mock auth — see section 4 to
     swap to Supabase).
   - Search "Lightning Bolt" — results should appear.
   - Add to collection → see it on `/`.

---

## 3. (Optional) DB-cached upgrade with Neon Postgres

If you want the backend to serve searches from a local DB cache instead of
hitting Scryfall every time, add a free **Neon** Postgres.

### Setup

1. Sign up at <https://neon.tech> (free tier, no expiration on the storage).
2. Create a project. Copy the connection string — it looks like:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. On Render, set:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `<the Neon connection string>` |
   | `ADMIN_TOKEN` | a long random string (e.g. `openssl rand -hex 32`) — needed to trigger ingest |

4. Redeploy. The backend will now boot in DB-cached mode and admin routes
   will be mounted.

### Run the bulk ingest (once)

The ingest streams ~500 MB and inserts ~110 k cards in ~45 s. Run it from
your **local machine** so Render's free RAM isn't the bottleneck:

```sh
# Apply migrations to the Neon DB (point your local backend at it)
DATABASE_URL=<neon-url> cd backend && npm run db:migrate

# Trigger the ingest against your prod backend
curl -X POST https://<your-render-url>/admin/scryfall/sync \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"kind":"all"}'
```

The response shows how many sets and cards landed. Re-run when Scryfall
publishes new sets — the upsert is idempotent.

After the ingest, search hits the Neon DB directly (faster, no Scryfall
rate limit on common queries). `getCardById` still falls back to Scryfall
on miss for cards released after the last sync.

---

## 4. (Optional) Real auth with Supabase

The codebase ships a Supabase auth backend (`src/features/auth/supabaseBackend.ts`)
that activates when both env vars are set. Without them, the in-browser
mock auth (Dexie-backed, dev-only) stays in charge.

### Setup

1. Sign up at <https://supabase.com> and create a project.
2. **Authentication → Providers → Email** : enable email + password sign-up.
3. **Project Settings → API** : copy the **Project URL** and the **anon
   public** key.
4. On Vercel, add:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://<project>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ…` (anon public key) |

5. Redeploy the frontend.

### What changes

- Sign-up / sign-in / password reset all go through Supabase.
- Sessions persist in localStorage (Supabase default), survive reload.
- The mock IndexedDB auth DB on existing users gets stranded — they need
  to re-create their account on Supabase. There is no migration today.

The backend doesn't need to know about Supabase at this stage — auth is
direct between the frontend and Supabase. When `/v1/items/*` sync routes
are added later, the backend will validate Supabase JWTs server-side; that
work isn't in this codebase yet (see `CLAUDE.md` "What's NOT yet wired").

---

## 5. Updating the deployment

- **Frontend** : push to `main` → Vercel auto-deploys preview / prod
  according to the branch rules you configure.
- **Backend** : same with Render — push to `main` triggers a new build.
  No need to bump versions.

The PWA service worker auto-updates on the next visit after a deploy. Hard
refreshes (Ctrl+Shift+R) skip the SW cache if you need to see the new
build immediately.

---

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend shows "Recherche indisponible" | Backend asleep (cold-start), or `VITE_API_BASE_URL` wrong, or CORS_ORIGINS missing the Vercel URL |
| 502 Bad Gateway from backend | Scryfall upstream is down or rate-limited. Check Render logs. |
| 500 with "Failed query" on backend | `DATABASE_URL` is set but Postgres is unreachable. Either remove the var (proxy-only) or fix the connection string. |
| Sign-up returns "email_exists" but you've never signed up | You're hitting Supabase but the project still has an old user. Either create a fresh project or clean it up in the Supabase dashboard. |
| First request after sleep takes 30 s | Render free tier behaviour, normal. Upgrade or accept it. |
