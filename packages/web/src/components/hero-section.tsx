import { Button } from '@frontend/components/ui/button';
import { Layers, Lightning, Rocket, ShieldCheck } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from '@tanstack/react-router';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-32">
      <div className="-z-10 absolute inset-0 flex items-center justify-center">
        <div className="relative size-[800px] md:size-[1200px]">
          <div className="absolute inset-0 rounded-full border border-border/50" />
          <div className="absolute inset-8 rounded-full border border-border/30" />
          <div className="absolute inset-16 rounded-full border border-border/20" />
        </div>
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-muted-foreground text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Bun-first. Typed end to end.
          </div>

          <h1 className="mb-6 text-balance font-semibold text-4xl tracking-tight md:text-6xl lg:text-7xl">
            Ship typed Bun apps
            <br />
            <span className="text-primary">without rebuilding the plumbing</span>
          </h1>

          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
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
                // biome-ignore lint/a11y/useAnchorContent: <>
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
                <HugeiconsIcon icon={Lightning} className="size-5 text-primary" />
                <div className="font-medium text-sm">One Bun server</div>
              </div>
              <div className="text-muted-foreground text-xs">SSR and API, same origin</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ShieldCheck} className="size-5 text-primary" />
                <div className="font-medium text-sm">Typed contracts</div>
              </div>
              <div className="text-muted-foreground text-xs">Database to React</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Layers} className="size-5 text-primary" />
                <div className="font-medium text-sm">Secure auth</div>
              </div>
              <div className="text-muted-foreground text-xs">Server-side sessions</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Rocket} className="size-5 text-primary" />
                <div className="font-medium text-sm">Explicit choices</div>
              </div>
              <div className="text-muted-foreground text-xs">Documented tradeoffs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
