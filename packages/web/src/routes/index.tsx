import { seo } from '@frontend/lib/seo';
import Index from '@frontend/pages/index';
import { createFileRoute } from '@tanstack/react-router';

const metadata = seo({
  title: 'Elysium — Ship typed Bun applications',
  description: 'TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL in one production-minded starter.',
});

export const Route = createFileRoute('/')({
  head: () => ({
    meta: metadata.meta,
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
  component: Index,
});
