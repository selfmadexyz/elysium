import Index from '@frontend/pages/index';
import { createFileRoute } from '@tanstack/react-router';

const title = 'Elysium — Ship typed Bun applications';
const description = 'TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL in one production-minded starter.';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
    ],
  }),
  component: Index,
});
