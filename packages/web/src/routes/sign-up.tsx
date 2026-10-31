import { getSession } from '@frontend/lib/auth-server';
import { redirectSearchSchema } from '@frontend/lib/validations';
import { SignUp } from '@frontend/pages/sign-up';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
  validateSearch: redirectSearchSchema,
  head: () => ({ meta: [{ title: 'Sign up' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  beforeLoad: async ({ location }) => {
    if (await getSession()) {
      throw redirect({ to: '/', search: { redirect: location.href } });
    }
  },
});
