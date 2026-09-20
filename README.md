<div align="center">
  <img src="https://starter-elysium.vercel.app/logo512.png" alt="Elysium Logo" width="200"/>

# Full Stack TypeScript Starter

  Modern full-stack monorepo with Bun, React, Elysia, and Drizzle ORM. End-to-end type safety from database to UI.
</div>

## Tech Stack

- **Runtime:** Bun
- **Frontend:** React 19 + TanStack Start/Query + Tailwind CSS 4
- **Backend:** Elysia + TypeScript
- **Database:** PostgreSQL + Drizzle ORM + drizzle-typebox
- **Auth:** Better Auth (Google OAuth)
- **Type-safety:** Eden Treaty (end-to-end)

## Quick Start

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Setup environment variables**

   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

3. **Configure environment variables**
   - Get Google OAuth credentials at <https://console.cloud.google.com>
   - Generate auth secret: `openssl rand -base64 32`
   - Setup PostgreSQL database

4. **Start the application**

   ```bash
   just start
   ```

   This will:
   - Start PostgreSQL container
   - Install dependencies
   - Run database migrations
   - Start the TanStack Start dev server with the Elysia API

5. **Stop PostgreSQL**

   ```bash
   just stop
   ```

## Project Structure

```
packages/
├── backend/              # Elysia API
│   ├── src/
│   │   ├── modules/      # Feature modules (posts, auth, health)
│   │   │   └── posts/
│   │   │       ├── index.ts    # Routes (controller)
│   │   │       ├── service.ts  # Business logic
│   │   │       └── model.ts    # Validation + types
│   │   ├── database/     # DB schema
│   │   ├── lib/          # Errors, DB, models
│   │   └── routes/       # Route aggregation
│   └── drizzle/          # Migrations
└── web/                  # React frontend
    └── src/
        ├── pages/        # Page components
        ├── hooks/        # Custom hooks (use-posts, use-create-post, etc.)
        ├── components/   # UI components
        └── lib/          # Client, auth, utils
```

## Architecture

### Backend - Feature Modules

Each module follows the same pattern:

- `index.ts` - Routes (Elysia controller)
- `service.ts` - Business logic + DB queries
- `model.ts` - TypeBox schemas + types (generated from Drizzle)

**Error Handling:**

- Custom error classes (`BadRequestError`, `NotFoundError`, etc.)
- Auto re-throw in `ServerError` constructor
- Global error handler in `index.ts`

### Frontend - TanStack Start + Query

- **Router:** File-based routes with SSR, protected routes, and per-route metadata
- **Query:** Custom hooks pattern, consistent error handling, auto cache invalidation

## Available Commands (justfile)

### Main Commands

- `just start` - Start everything (PostgreSQL, install dependencies, run migrations, dev server)
- `just stop` - Stop PostgreSQL container
- `just reset-db` - Remove PostgreSQL container completely (stop + remove)

### Database Commands (Drizzle)

**Note:** Migrations are automatically run when using `just start`. Use these commands for manual operations:

```bash
cd packages/backend

# Run migrations manually
just migrate
# or
bun run db:migrate

# Push schema changes (development - bypasses migrations)
bun run db:push

# Generate new migrations
bun run db:generate

# Open Drizzle Studio
bunx drizzle-kit studio
```

## Environment Variables

**Backend** (`packages/backend/.env`):

```env
PORT=3001
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from console.cloud.google.com>
GOOGLE_CLIENT_SECRET=<from console.cloud.google.com>
```

**Google OAuth Setup:**

1. <https://console.cloud.google.com> → Create project → OAuth 2.0
2. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

## Documentation

- **API Docs:** <http://localhost:3000/api/swagger>
- **DB Studio:** `bunx drizzle-kit studio` in `packages/backend`
- **PostgreSQL URL:** Run `just postgres-url` to see the connection string

## Features

- ✅ End-to-end type safety (DB → API → UI)
- ✅ Feature-based modules (Elysia best practices)
- ✅ Auth with Google OAuth (Better Auth)
- ✅ Consistent error handling (backend + frontend)
- ✅ Auto-generated schemas (drizzle-typebox)
- ✅ CRUD example with mutations (TanStack Query)
- ✅ Path aliases + monorepo workspace

## License

MIT
