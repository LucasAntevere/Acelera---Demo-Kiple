# AGENTS.md — Kiple (Acelera Demo)

## Project Overview

**Kiple** is an HR analytics platform built to help organizations understand, retain, and develop their people. It transforms workforce signals into clear insights, enabling leaders to identify risks early and build stronger teams.

- **Stack:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Supabase (PostgreSQL database + Edge Functions)
- **Auth:** Supabase Auth
- **Dev port:** `9000` (configured in `vite.config.ts`)

---

## Repository Structure

```
src/
  components/       # Shared UI components (layout, metrics, shadcn/ui primitives)
  contexts/         # React contexts (AuthContext)
  hooks/            # Custom hooks for data fetching (employees, departments, etc.)
  integrations/     # Supabase client setup
  lib/              # Utilities (currency formatting, class helpers)
  pages/            # Route-level page components
  types/            # Shared TypeScript types (rh.ts)
supabase/
  config.toml       # Supabase project config (project_id: rnuguqmtdfhngvrwsbak)
  functions/        # Edge Functions (kiple-setup)
  migrations/       # SQL migration files (applied in chronological order)
  seeds/            # Seed and cleanup scripts
```

---

## Environment Variables

Copy `.env` and fill in the values before running the project. Required variables:

```env
VITE_SUPABASE_PROJECT_ID="rnuguqmtdfhngvrwsbak"
VITE_SUPABASE_URL="https://rnuguqmtdfhngvrwsbak.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-publishable-key>"
```

---

## Setup & Development

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:9000`.

---

## Supabase Migration & Deploy

> **Prerequisites:** `npx supabase` (Supabase CLI via npx) must be available. Set the access token and link the project before running any Supabase commands.

### How migrations work

**`scripts/migrate.ps1` is the standard way to deploy for any group.** It replaces `npx supabase db push` entirely. For each group deployment it:

1. Reads `VITE_DB_SCHEMA` from `.env`
2. Creates the PostgreSQL schema and grants the necessary permissions to Supabase roles
3. Rewrites all `public.` references in the migration files to the target schema
4. Executes each migration in chronological order via `supabase db query --linked`
5. Runs the seed files in order: cleanup → reference data → bulk seed

This means every group gets its own isolated schema within the same Supabase project. Set a unique `VITE_DB_SCHEMA` per group (e.g. `grupo1`, `grupo2`) in their `.env` file — the script handles the rest.

> **Note:** After running the script for a new schema, go to **Supabase dashboard → Project Settings → API → Exposed Schemas** and add the schema name so the client can reach it.

---

### Set the access token

```powershell
$env:SUPABASE_ACCESS_TOKEN="<your-access-token>"
```

### Link the project

```bash
npx supabase link --project-ref rnuguqmtdfhngvrwsbak
```

### Deploy migrations & seeds

Set the schema for the group in `.env` (see `.env.example`):

```env
VITE_DB_SCHEMA="grupo_a"   # unique per group, e.g. grupo_a, grupo_b, turma_1
```

Then run:

```powershell
# Preview substituted SQL without executing
.\scripts\migrate.ps1 -DryRun

# Apply migrations and seeds
.\scripts\migrate.ps1
```

Migrations (applied in order):
1. `20260311193000_rh_operacional.sql` — Core RH operational schema
2. `20260311221500_funcionario_data_nascimento_cargo.sql` — Employee birthdate and role fields
3. `20260311233000_departamentos_funcionarios.sql` — Departments and employees relationship

Seeds (applied in order):
1. `cleanup_funcionarios_desligamentos.sql` — Removes existing employees and terminations
2. `ref_data.sql` — Inserts required departments and termination reasons
3. `seed_rh_massivo.sql` — Bulk employee and termination data

### Deploy Edge Functions

Deploys all Edge Functions from `supabase/functions/` to the linked project:

```bash
npx supabase functions deploy
```

Functions:
- `kiple-setup` — Initial setup function (JWT verification disabled)

### Full deploy sequence (one-liner)

```powershell
$env:SUPABASE_ACCESS_TOKEN="<your-user-token>"; npx supabase link --project-ref rnuguqmtdfhngvrwsbak; npx supabase db push; npx supabase functions deploy
```

---

## Available Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm install`     | Install all project dependencies                 |
| `npm run dev`     | Start the Vite dev server on port 9000           |
| `npm run build`   | Production build                                 |
| `npm run build:dev` | Development mode build                         |
| `npm run preview` | Preview the production build locally             |
| `npm run lint`    | Run ESLint                                       |
| `npm run test`    | Run unit tests (Vitest, single run)              |
| `npm run test:watch` | Run unit tests in watch mode                 |

---

## Key Pages

| Route           | Page Component       | Description                        |
|-----------------|----------------------|------------------------------------|
| `/`             | `Index.tsx`          | Landing / redirect                 |
| `/login`        | `Login.tsx`          | Authentication                     |
| `/dashboard`    | `Dashboard.tsx`      | Main HR analytics dashboard        |
| `/employees`    | `Employees.tsx`      | Employee management                |
| `/departments`  | `Departments.tsx`    | Department management              |
| `/benefits`     | `Benefits.tsx`       | Benefits management                |
| `/terminations` | `Terminations.tsx`   | Termination tracking               |
| `/settings`     | `Settings.tsx`       | Application settings               |
| `/db-setup`     | `DatabaseSetup.tsx`  | Database initialization helper     |

---

## Architecture Notes

- All Supabase queries go through custom hooks in `src/hooks/` using TanStack Query for caching and re-fetching.
- Protected routes are wrapped by `ProtectedRoute.tsx`, which reads auth state from `AuthContext`.
- The `@` path alias resolves to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- shadcn/ui components live in `src/components/ui/` and should not be edited directly — regenerate via the CLI if updates are needed.
