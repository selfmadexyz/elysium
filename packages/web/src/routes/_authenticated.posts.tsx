import { seo } from '@frontend/lib/seo';
import { Posts } from '@frontend/pages/posts';
import { createFileRoute } from '@tanstack/react-router';

const metadata = seo({
  title: 'Posts — Elysium',
  description: 'Manage your private posts in Elysium.',
  path: '/posts',
});

export const Route = createFileRoute('/_authenticated/posts')({
  head: () => ({
    meta: [...metadata.meta, { name: 'robots', content: 'noindex, nofollow' }],
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
  ssr: false,
  component: Posts,
});
