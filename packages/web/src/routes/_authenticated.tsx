import { AppLayout } from '@frontend/layouts/app-layout';
import { getSession } from '@frontend/lib/auth-server';
import { redirectSearchSchema } from '@frontend/lib/validations';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  validateSearch: redirectSearchSchema,
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      });
    }

    return { session };
  },
  component: AppLayout,
});
