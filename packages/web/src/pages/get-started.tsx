import { CodeBlock } from '@frontend/components/ui/code-block';
import { auth } from '@frontend/lib/auth';
import {
  CheckCircle,
  Database,
  ExternalLink,
  FileCode,
  GitBranch,
  Layout,
  Lock,
  Server,
  Shield,
  Zap,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from '@tanstack/react-router';

const techStack = [
  { icon: Zap, label: 'Bun', desc: 'Runtime' },
  { icon: Layout, label: 'React 19', desc: 'Frontend' },
  { icon: Server, label: 'Elysia', desc: 'Backend' },
  { icon: Database, label: 'PostgreSQL', desc: 'Database' },
  { icon: Shield, label: 'Better Auth', desc: 'Authentication' },
  { icon: FileCode, label: 'Drizzle ORM', desc: 'Type-safe SQL' },
];

const features = [
  'End-to-end type safety (DB → API → UI)',
  'Feature-based modules (Elysia best practices)',
  'Auth with Google OAuth (Better Auth)',
  'Consistent error handling (backend + frontend)',
  'Auto-generated schemas (drizzle-typebox)',
  'CRUD example with mutations (TanStack Query)',
  'Path aliases + monorepo workspace',
];

export default function GetStarted() {
  const { data: session } = auth.useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-border border-b bg-card/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">Get Started</h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Your complete guide to setting up and running the Elysium starter kit locally.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to={session ? '/posts' : '/sign-in'}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {session ? 'Go to Posts' : 'Sign In'}
              </Link>
              <a
                href="https://github.com/menefrego15/starter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <HugeiconsIcon icon={GitBranch} className="size-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          {/* Tech Stack */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Tech Stack</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {techStack.map(({ icon, label, desc }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 text-center"
                >
                  <HugeiconsIcon icon={icon} className="size-8 text-primary" />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-muted-foreground text-xs">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <HugeiconsIcon icon={CheckCircle} className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Quick Start</h2>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 font-medium">1. Install dependencies</h3>
                <CodeBlock language="bash">bun install</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 font-medium">2. Setup environment variables</h3>
                <CodeBlock language="bash">cp packages/backend/.env.example packages/backend/.env</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 font-medium">3. Configure environment</h3>
                <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <HugeiconsIcon icon={Lock} className="mt-1 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Google OAuth</p>
                      <p className="text-muted-foreground text-sm">
                        Get credentials at{' '}
                        <a
                          href="https://console.cloud.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          console.cloud.google.com
                          <HugeiconsIcon icon={ExternalLink} className="size-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <HugeiconsIcon icon={Shield} className="mt-1 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Auth Secret</p>
                      <p className="text-muted-foreground text-sm">
                        Generate:{' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">openssl rand -base64 32</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium">4. Start the application</h3>
                <CodeBlock language="bash">just start</CodeBlock>
                <p className="mt-2 text-muted-foreground text-sm">
                  This starts PostgreSQL, runs migrations, and launches the TanStack Start server with the Elysia API.
                </p>
              </div>
            </div>
          </section>

          {/* Project Structure */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Project Structure</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Layout} className="size-5" />
                <span className="font-medium text-sm">Monorepo Layout</span>
              </div>
              <CodeBlock language="text">
                {`packages/
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
        ├── hooks/        # Custom hooks
        ├── components/   # UI components
        └── lib/          # Client, auth, utils`}
              </CodeBlock>
            </div>
          </section>

          {/* Architecture */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Architecture</h2>

            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-3 font-medium">Backend — Feature Modules</h3>
                <p className="mb-4 text-muted-foreground text-sm">Each module follows the same pattern:</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">index.ts</code> — Routes (Elysia
                    controller)
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">service.ts</code> — Business logic + DB
                    queries
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">model.ts</code> — TypeBox schemas + types
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-3 font-medium">Frontend — TanStack Start + Query</h3>
                <p className="text-muted-foreground text-sm">
                  File-based routing with SSR, protected routes, per-route metadata, custom hooks, and automatic cache
                  invalidation.
                </p>
              </div>
            </div>
          </section>

          {/* Environment Variables */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Environment Variables</h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-medium">Backend</h3>
                <CodeBlock language="env">
                  {`PORT=3001
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from console.cloud.google.com>
GOOGLE_CLIENT_SECRET=<from console.cloud.google.com>`}
                </CodeBlock>
              </div>
            </div>
          </section>

          {/* Google OAuth Setup */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Google OAuth Setup</h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                  1
                </span>
                <span>
                  Go to{' '}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.cloud.google.com
                  </a>{' '}
                  → Create project → OAuth 2.0
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                  2
                </span>
                <span>Add redirect URI:</span>
              </li>
            </ol>
            <div className="mt-3 ml-9">
              <CodeBlock language="text">http://localhost:3000/api/auth/callback/google</CodeBlock>
            </div>
          </section>

          {/* Available Commands */}
          <section className="mb-16">
            <h2 className="mb-6 font-semibold text-2xl">Available Commands</h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-medium">Main Commands</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <code className="text-sm">just start</code>
                    <span className="text-muted-foreground text-sm">Start PostgreSQL + full-stack server</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <code className="text-sm">just stop</code>
                    <span className="text-muted-foreground text-sm">Stop all services</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <code className="text-sm">just migrate</code>
                    <span className="text-muted-foreground text-sm">Run database migrations</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium">PostgreSQL Commands</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    'postgres-start',
                    'postgres-stop',
                    'postgres-remove',
                    'postgres-url',
                    'postgres-status',
                    'postgres-shell',
                  ].map((cmd) => (
                    <div
                      key={cmd}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <code className="text-xs">just {cmd}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Documentation Links */}
          <section>
            <h2 className="mb-6 font-semibold text-2xl">Documentation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="http://localhost:3000/api/swagger"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <HugeiconsIcon icon={FileCode} className="size-5 text-primary" />
                <div>
                  <p className="font-medium">API Docs</p>
                  <p className="text-muted-foreground text-xs">Swagger UI at /api/swagger</p>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <HugeiconsIcon icon={Database} className="size-5 text-primary" />
                <div>
                  <p className="font-medium">Drizzle Studio</p>
                  <p className="text-muted-foreground text-xs">bunx drizzle-kit studio</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
