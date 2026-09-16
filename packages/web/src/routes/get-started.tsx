import { seo } from '@frontend/lib/seo';
import GetStarted from '@frontend/pages/get-started';
import { createFileRoute } from '@tanstack/react-router';

const metadata = seo({
  title: 'Get started with Elysium',
  description: 'Install, configure, and run the Elysium Bun full-stack starter.',
  path: '/get-started',
});

export const Route = createFileRoute('/get-started')({
  head: () => ({ meta: metadata.meta, links: [{ rel: 'canonical', href: metadata.canonical }] }),
  component: GetStarted,
});
