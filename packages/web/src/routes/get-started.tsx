import { CodeBlock } from '@frontend/components/ui/code-block';
import { seo } from '@frontend/lib/seo';
import { CheckCircle, Database, FileCode, GitBranch, Layout, Server, Shield, Zap } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { createFileRoute } from '@tanstack/react-router';

const metadata = seo({
  title: 'Get started with Elysium',
  description: 'Install, configure, and run the Elysium Bun full-stack starter.',
  path: '/get-started',
});

export const Route = createFileRoute('/get-started')({
  ssr: true,
  head: () => ({ meta: metadata.meta, links: [{ rel: 'canonical', href: metadata.canonical }] }),
  component: GetStarted,
});

const stack = [
  { icon: Zap, label: 'Bun', detail: 'runtime & workspaces' },
  { icon: Layout, label: 'TanStack Start', detail: 'flexible rendering & routing' },
  { icon: Server, label: 'Elysia', detail: 'typed API' },
  { icon: Database, label: 'PostgreSQL', detail: 'database' },
  { icon: Shield, label: 'Better Auth', detail: 'authentication' },
  { icon: FileCode, label: 'Drizzle', detail: 'schema & migrations' },
];

const features = [
  'Pre-rendered public pages with route-level SEO metadata and a client-rendered private app',
  'One same-origin deployment for the UI, API, and authentication',
  'Typed API client shared from Elysia to React',
  'Database-backed sessions and ownership-scoped example CRUD',
  'Reproducible migrations, Docker images, and CI checks',
  'Accessible components, dark mode, and reduced-motion support',
];

function GetStarted() {
  return (
    <main className="bg-background min-h-screen">
      <section className="border-border bg-card/50 border-b py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-primary mb-3 text-sm font-medium">Elysium setup guide</p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Ship the first feature, not the setup
            </h1>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
              A focused Bun starter with a typed API, authentication, and PostgreSQL. Choose static pages, client
              rendering, or server rendering for each part of your product.
            </p>
            <a
              href="https://github.com/selfmadexyz/elysium"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            <h2 id="stack-title" className="mb-6 text-2xl font-semibold">
              Stack
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stack.map(({ icon, label, detail }) => (
                <div key={label} className="border-border bg-card flex items-center gap-3 rounded-lg border p-4">
                  <HugeiconsIcon icon={icon} className="text-primary size-7 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-muted-foreground text-xs">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="quick-start-title">
            <h2 id="quick-start-title" className="mb-2 text-2xl font-semibold">
              Local setup
            </h2>
            <p className="text-muted-foreground mb-6">
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
                <p className="text-muted-foreground mt-3 text-sm">
                  Replace the generated auth secret and add Google credentials only if you want OAuth locally.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-medium">2. Start the complete application</h3>
                <CodeBlock language="bash">just dev</CodeBlock>
                <p className="text-muted-foreground mt-3 text-sm">
                  This starts PostgreSQL, applies migrations, and serves the app at http://localhost:3000. The API is
                  available under /api on the same origin.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-medium">3. Run the quality gate</h3>
                <CodeBlock language="bash">just check</CodeBlock>
                <p className="text-muted-foreground mt-3 text-sm">
                  The same lint, typecheck, tests, and production build run in CI.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="included-title">
            <h2 id="included-title" className="mb-6 text-2xl font-semibold">
              What is included
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
                  <HugeiconsIcon icon={CheckCircle} className="text-primary mt-0.5 size-5 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="structure-title">
            <h2 id="structure-title" className="mb-6 text-2xl font-semibold">
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
        └── routes/     # pages, guards, API bridge, SEO endpoints`}
            </CodeBlock>
          </section>
        </div>
      </div>
    </main>
  );
}
