import { getSession } from '@frontend/lib/auth-server';
import { seo } from '@frontend/lib/seo';
import { redirectSearchSchema } from '@frontend/lib/validations';
import { SignUp } from '@frontend/pages/sign-up';
import { createFileRoute, redirect } from '@tanstack/react-router';

const metadata = seo({
  title: 'Create an account — Elysium',
  description: 'Create your Elysium account.',
  path: '/sign-up',
});

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
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
