import { getSession } from '@frontend/lib/auth-server';
import { redirectSearchSchema } from '@frontend/lib/validations';
import { SignIn } from '@frontend/pages/sign-in';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in')({
  component: SignIn,
  validateSearch: redirectSearchSchema,
  head: () => ({ meta: [{ title: 'Sign in' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  beforeLoad: async ({ location }) => {
    if (await getSession()) {
      throw redirect({ to: '/', search: { redirect: location.href } });
    }
  },
});
