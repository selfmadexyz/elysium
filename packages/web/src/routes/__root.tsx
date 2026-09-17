/// <reference types="vite/client" />

import { Toaster } from '@frontend/components/ui/sonner';
import { seo } from '@frontend/lib/seo';
import '@frontend/styles.css';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { lazy, type ReactNode, Suspense } from 'react';

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then(({ TanStackRouterDevtools }) => ({
        default: TanStackRouterDevtools,
      })),
    )
  : () => null;

const QueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => ({ default: ReactQueryDevtools })),
    )
  : () => null;

const defaultSeo = seo({
  title: 'Elysium — Bun-first full-stack starter',
  description: 'A typed Bun starter with TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL.',
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ffffff' },
      ...defaultSeo.meta,
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <RootDocument>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-semibold text-3xl">Something went wrong</h1>
        <p className="max-w-lg text-muted-foreground">
          {import.meta.env.DEV && error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <button className="rounded-md border px-4 py-2" onClick={reset} type="button">
          Try again
        </button>
        <Link className="underline" to="/">
          Return home
        </Link>
      </main>
    </RootDocument>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-semibold text-3xl">Page not found</h1>
      <Link className="underline" to="/">
        Return home
      </Link>
    </main>
  ),
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
          href="#main-content"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <Suspense>
          <RouterDevtools position="bottom-right" />
          <QueryDevtools buttonPosition="bottom-left" />
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
