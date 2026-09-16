import { CodeBlock } from '@frontend/components/ui/code-block';
import { CheckCircle, Database, FileCode, GitBranch, Layout, Server, Shield, Zap } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const stack = [
  { icon: Zap, label: 'Bun', detail: 'runtime & workspaces' },
  { icon: Layout, label: 'TanStack Start', detail: 'SSR & routing' },
  { icon: Server, label: 'Elysia', detail: 'typed API' },
  { icon: Database, label: 'PostgreSQL', detail: 'database' },
  { icon: Shield, label: 'Better Auth', detail: 'authentication' },
  { icon: FileCode, label: 'Drizzle', detail: 'schema & migrations' },
];

const features = [
  'Server-rendered public pages with route-level SEO metadata',
  'One same-origin deployment for the UI, API, and authentication',
  'Typed API client shared from Elysia to React',
  'Database-backed sessions and ownership-scoped example CRUD',
  'Reproducible migrations, Docker images, and CI checks',
  'Accessible components, dark mode, and reduced-motion support',
];

export default function GetStarted() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-border border-b bg-card/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 font-medium text-primary text-sm">Elysium setup guide</p>
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
              Ship the first feature, not the setup
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              A focused Bun starter for products that need server rendering, a typed API, authentication, and PostgreSQL
              from day one.
            </p>
            <a
              href="https://github.com/selfmadexyz/elysium"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <HugeiconsIcon icon={GitBranch} className="size-4" />
              View source
            </a>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="mx-auto max-w-4xl space-y-16">
          <section aria-labelledby="stack-title">
            <h2 id="stack-title" className="mb-6 font-semibold text-2xl">
              Stack
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stack.map(({ icon, label, detail }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <HugeiconsIcon icon={icon} className="size-7 shrink-0 text-primary" />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-muted-foreground text-xs">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="quick-start-title">
            <h2 id="quick-start-title" className="mb-2 font-semibold text-2xl">
              Local setup
            </h2>
            <p className="mb-6 text-muted-foreground">
              You need Bun 1.4 or newer and Docker. Just is optional, but gives you the shortest workflow.
            </p>
            <div className="space-y-8">
              <div>
                <h3 className="mb-3 font-medium">1. Install and configure</h3>
                <CodeBlock language="bash">
                  {`bun install
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env`}
                </CodeBlock>
                <p className="mt-3 text-muted-foreground text-sm">
                  Replace the generated auth secret and add Google credentials only if you want OAuth locally.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-medium">2. Start the complete application</h3>
                <CodeBlock language="bash">just dev</CodeBlock>
                <p className="mt-3 text-muted-foreground text-sm">
                  This starts PostgreSQL, applies migrations, and serves the app at http://localhost:3000. The API is
                  available under /api on the same origin.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-medium">3. Run the quality gate</h3>
                <CodeBlock language="bash">just check</CodeBlock>
                <p className="mt-3 text-muted-foreground text-sm">
                  The same lint, typecheck, tests, and production build run in CI.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="included-title">
            <h2 id="included-title" className="mb-6 font-semibold text-2xl">
              What is included
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <HugeiconsIcon icon={CheckCircle} className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="structure-title">
            <h2 id="structure-title" className="mb-6 font-semibold text-2xl">
              Project structure
            </h2>
            <CodeBlock language="text">
              {`packages/
├── backend/            # Elysia app, auth, database, migrations
│   ├── drizzle/
│   ├── src/modules/
│   └── test/
└── web/                # TanStack Start application
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        └── routes/     # pages, guards, API bridge, SEO endpoints`}
            </CodeBlock>
          </section>
        </div>
      </div>
    </main>
  );
}
