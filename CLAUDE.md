# Design Hub — Project Reference

## What This App Does
Design Hub is a private internal voting tool. Admins upload design options (images), share a link with stakeholders, and stakeholders vote on their preferred design and leave a reason. Admins see results in real time.

## Tech Stack
- **Frontend/Backend:** Next.js 15 App Router (TypeScript)
- **Database + Auth:** Supabase (Postgres, RLS, magic-link email login)
- **Storage:** Supabase Storage (`designs` bucket) for design images
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Email:** Resend (optional, fire-and-forget vote notifications)

## Project Structure
```
app/
  admin/              ← Admin dashboard (list/create/manage projects)
  admin/projects/[id]/         ← Edit a project, manage design versions
  admin/projects/[id]/results/ ← View vote results with pie chart
  api/upload/         ← Image upload endpoint (Supabase Storage)
  api/vote/           ← Submit a vote
  api/vote/results/   ← Fetch vote counts
  auth/callback/      ← Supabase magic-link callback
  login/              ← Admin login page (magic-link OTP)
  open/               ← Public projects list (no auth required)
  vote/[slug]/[shortId]/ ← Public voting page
components/ui/        ← Toast, StatusBadge, ImageLightbox, ResultsChart
emails/               ← HTML email templates (vote notification, thank-you)
lib/
  supabase/           ← Supabase client helpers (server, client, admin, middleware)
  utils.ts            ← Shared utilities (slugs, date helpers, vote calc)
  validations.ts      ← Zod schemas for all inputs
  rate-limit.ts       ← In-memory rate limiter (5 req/min per key)
middleware.ts         ← Supabase session refresh on every request
supabase/migrations/  ← SQL schema (001_schema.sql, 002_rls.sql)
```

## Key Design Decisions
- **Magic-link only auth** — no passwords. Admins enter email, get a one-time link.
- **ALLOWED_EMAIL_DOMAIN** env var restricts who can log in (e.g. `gmail.com`)
- **RLS everywhere** — database policies enforce that public users can only insert votes and read live projects; admins only see their own projects
- **Service-role admin client** — used server-side only for operations that bypass RLS (image uploads, creating projects)
- **No voter accounts** — voters are anonymous; uniqueness enforced by `(project_id, voter_email)` unique constraint
- **Results visibility** controlled by `results_mode`: `after_vote`, `after_close`, or `never`

## Environment Variables (all required)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Full Vercel URL (e.g. `https://design-hub.vercel.app`) |
| `ALLOWED_EMAIL_DOMAIN` | Domain allowed to log in as admin (e.g. `gmail.com`) |
| `RESEND_API_KEY` | (Optional) Resend key for email notifications |
| `EMAIL_FROM` | (Optional) Sender name/email for notifications |

## Database Setup (run once in Supabase SQL Editor)
Run `supabase/migrations/001_schema.sql` then `supabase/migrations/002_rls.sql`.
After running, add your admin email:
```sql
insert into public.admin_allowlist (email) values ('your@email.com');
```

## Supabase Auth Setup
1. Go to Supabase → Authentication → URL Configuration
2. Set **Site URL** to your Vercel URL
3. Add `https://your-vercel-url.vercel.app/auth/callback` to **Redirect URLs**

## How to Use (after deployment)
1. Visit `/login` — enter your admin email — click the magic link in your inbox
2. You land on `/admin` — create a new project, upload design images, set it to Active
3. Share the `/vote/[slug]/[shortId]` link with stakeholders
4. View results at `/admin/projects/[id]/results`

## Deployment (Vercel)
- Connect GitHub repo to Vercel
- Framework: Next.js
- Root Directory: blank (files must be at repo root, not in a subfolder)
- Add all 5 environment variables before deploying

## Current Admin Email
`sherlylopez27@gmail.com` — pre-inserted into `admin_allowlist` in the seed SQL.

## Troubleshooting
- **500 MIDDLEWARE_INVOCATION_FAILED** → Supabase env vars missing or wrong
- **"No pages or app directory"** → Files are in a subfolder; set Root Directory in Vercel or move files to repo root
- **"No Next.js version detected"** → `package.json` not at the root Vercel is looking at; same fix as above
- **Login email never arrives** → Check Supabase Auth → URL Configuration has correct Site URL and Redirect URL
- **Can't log in after clicking link** → `NEXT_PUBLIC_SITE_URL` doesn't match actual Vercel URL
