import { Button } from '@frontend/components/ui/button';
import { seo } from '@frontend/lib/seo';
import { Layers, Lightning, Rocket, ShieldCheck } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { createFileRoute, Link } from '@tanstack/react-router';

const metadata = seo({
  title: 'Elysium — Ship typed Bun applications',
  description: 'TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL in one production-minded starter.',
});

export const Route = createFileRoute('/')({
  ssr: true,
  head: () => ({
    meta: metadata.meta,
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
  component: Index,
});

function Index() {
  return (
    <main id="main-content">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-32">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="relative size-[800px] md:size-[1200px]">
            <div className="border-border/50 absolute inset-0 rounded-full border" />
            <div className="border-border/30 absolute inset-8 rounded-full border" />
            <div className="border-border/20 absolute inset-16 rounded-full border" />
          </div>
        </div>

        <div className="relative z-10 container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="border-border bg-card text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <span className="relative flex size-2">
                <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none" />
                <span className="bg-primary relative inline-flex size-2 rounded-full" />
              </span>
              Bun-first. Typed end to end.
            </div>

            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
              Ship typed Bun apps
              <br />
              <span className="text-primary">without rebuilding the plumbing</span>
            </h1>

            <p className="text-muted-foreground mb-10 text-lg md:text-xl">
              Elysium connects TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL in one focused starter.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" render={<Link to="/get-started" />} nativeButton={false}>
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={
                  <a
                    aria-label="View on GitHub"
                    href="https://github.com/selfmadexyz/elysium"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                nativeButton={false}
              >
                View on GitHub
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-6 text-left md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Lightning} className="text-primary size-5" />
                  <div className="text-sm font-medium">One Bun server</div>
                </div>
                <div className="text-muted-foreground text-xs">SSR and API, same origin</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={ShieldCheck} className="text-primary size-5" />
                  <div className="text-sm font-medium">Typed contracts</div>
                </div>
                <div className="text-muted-foreground text-xs">Database to React</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Layers} className="text-primary size-5" />
                  <div className="text-sm font-medium">Secure auth</div>
                </div>
                <div className="text-muted-foreground text-xs">Server-side sessions</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Rocket} className="text-primary size-5" />
                  <div className="text-sm font-medium">Explicit choices</div>
                </div>
                <div className="text-muted-foreground text-xs">Documented tradeoffs</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
