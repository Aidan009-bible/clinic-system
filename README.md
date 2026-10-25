# Clinic_With_2idiots

This project is a working clinic management demo with:

- cookie-based demo authentication
- role-based dashboards for `admin`, `doctor`, and `reception`
- backend API routes for login, patient creation, visit updates, counter completion, and stock changes
- local JSON fallback storage for quick testing
- Supabase PostgreSQL persistence for Vercel deployments

The MKKT branch adds responsive layouts for phones, tablets, and computers, queue actions, and hosted persistence for Vercel.

## Default login

- `admin` / `admin123`
- `doctor` / `doctor123`
- `reception` / `reception123`

## Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Current UI/UX direction

The current redesign direction is a LabPro-inspired modern clinic staff portal:

- deep medical navy, clinical blue, white, soft gray, and pale lab-blue panels
- soft emerald money-green treatment for revenue and completed/healthy states
- amber for waiting/warning states and rose/red for danger or urgent stock states
- clean operational dashboard layouts instead of marketing-style pages
- professional buttons, forms, tables, status badges, and role-based navigation
- fast scanning for reception, doctor, billing, and medicine stock workflows
- restrained shadows, clear spacing, and consistent border radius

The redesign is focused on presentation only. Existing clinic workflows, API routes, demo auth, local data behavior, and role permissions should remain unchanged unless a specific bug fix is requested.

Completed UI/UX refresh areas:

- Login page and sign-in panel
- Shared dashboard shell, sidebar navigation, logout button, and back button
- Admin overview, patient registry, stock tools, medicine table, and revenue cards
- Doctor queue workbench, active consultation visit page, patient history, overview, and stock reference copy
- Shared `PortalOverview` component used by doctor and reception overview pages

See `PROJECT_SPEC.md` and `CHANGELOG.md` for the current design plan and edited files.

## Supabase setup for Vercel

Without a server secret, local development uses `data/clinic-store.json`. When both variables below are configured, all clinic records are read from and saved to Supabase PostgreSQL.

1. Create a Supabase project.
2. Run `supabase/schema.sql` once in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SECRET_KEY=your-server-secret-key
SESSION_SECRET=at-least-32-random-characters
```

4. Sign into Vercel with `vercel login` and link with `vercel link --project clinic-mkkt`.
5. Run `npm run deploy`. This verifies the database schema, generates SESSION_SECRET if missing, configures Production and Preview variables without printing their values, and deploys to Production.
6. The first authenticated request creates the initial demo snapshot in `clinic_state`. Local JSON data is not automatically uploaded or migrated.

Keep `SUPABASE_SECRET_KEY` server-only and never rename it with a `NEXT_PUBLIC_` prefix. The table has row level security enabled and no browser-access policy. Revision checks reject simultaneous conflicting saves instead of overwriting records; refresh and retry when that happens. Sessions are signed and expire after 12 hours. Vercel requires database credentials and SESSION_SECRET; it never falls back to local files.

This snapshot-backed storage and the displayed shared demo accounts are for initial testing. Before live clinical use, configure individual staff accounts, production authentication, normalized tables, and backups. Supabase Free can pause after inactivity and has storage limits.

## Responsive layouts

The sidebar has a mobile menu on phones/tablets and minimize/expand controls on desktop. Inventory remains a spreadsheet with horizontal scrolling inside the table. Forms stack on phones, input text avoids mobile browser zoom, and sign-in appears first on small screens.

Validated at 390, 768, 1024, and 1440 pixels, plus the consultation form at 320 pixels. Run `npm test`, `npm run lint`, and `npm run build` before deploying.

## What each role can test

- `admin`: review demo users, see reports, adjust medicine stock
- `reception`: register patients, create visits, complete prescriptions at counter
- `doctor`: manage the active queue, continue consultations, review billing-ready visits, enter diagnosis, notes, fees, and stock-based prescriptions

## UI/UX work rules

- Keep backend behavior, data model, API routes, authentication, and feature logic unchanged.
- Record every changed file in `CHANGELOG.md`.
- Prefer focused design changes that match the existing role workflow.
- Run `npm run lint` after UI edits.

Current lint status:

- `npm run lint` passes with 0 errors.
- Existing warnings remain for `<img>` usage in `src/components/admin-actions.tsx` and `src/components/medicine-stock-table.tsx`.

## Useful commands

```bash
npm run lint
npm run build
```
