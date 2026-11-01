import { getSession } from '@frontend/lib/auth-server';
import { seo } from '@frontend/lib/seo';
import { redirectSearchSchema } from '@frontend/lib/validations';
import { SignIn } from '@frontend/pages/sign-in';
import { createFileRoute, redirect } from '@tanstack/react-router';

const metadata = seo({
  title: 'Sign in — Elysium',
  description: 'Sign in to your Elysium account.',
  path: '/sign-in',
});

export const Route = createFileRoute('/sign-in')({
  component: SignIn,
  validateSearch: redirectSearchSchema,
  head: () => ({
    meta: [...metadata.meta, { name: 'robots', content: 'noindex, nofollow' }],
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
  beforeLoad: async () => {
    if (await getSession()) {
      throw redirect({
        to: '/posts',
      });
    }
  },
});
