# TingSync

**Workforce Management, Synced.** — Multi-tenant workforce platform: attendance, employees, tasks, leave, payroll (PH deductions), expenses, inventory, site QR check-in posters, reports, and backups.

## Stack

- React 19 + Vite 8 + Tailwind CSS v4
- Supabase (Postgres, Auth, RLS, Edge Functions)
- React Router 7, Lucide icons, qrcode

## Setup

```bash
npm install
# create .env.local with your Supabase credentials (see below)
npm run dev                  # http://localhost:5174
```

`.env.local`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deploy (Netlify)

`netlify.toml` is included — build command `npm run build`, publish `dist`, SPA fallback redirect. Set the two `VITE_*` environment variables in the Netlify project settings.

## Architecture notes

- Multi-tenant: every table carries `org_id`; Row Level Security scopes all reads/writes to the caller's organization via `current_org_id()` / `is_admin()` helpers.
- Self-serve signup provisions a workspace through the `create-organization` Edge Function (org + owner profile + default settings, leave types, roles).
- Employees are created by admins through the `create-employee` Edge Function, which returns a one-time 6-digit PIN used as their mobile-app password.
