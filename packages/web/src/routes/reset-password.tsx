import { AuthShell } from '@frontend/components/auth/auth-shell';
import { TextField } from '@frontend/components/auth/text-field';
import { Button } from '@frontend/components/ui/button';
import { FieldDescription, FieldGroup } from '@frontend/components/ui/field';
import { auth } from '@frontend/lib/auth';
import { seo } from '@frontend/lib/seo';
import { newPasswordSchema, resetPasswordSearchSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

const metadata = seo({
  title: 'Choose a new password — Elysium',
  description: 'Choose a new Elysium password.',
  path: '/reset-password',
});

export const Route = createFileRoute('/reset-password')({
  component: ResetPassword,
  validateSearch: resetPasswordSearchSchema,
  head: () => ({
    meta: [
      ...metadata.meta,
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
    ],
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
});

function ResetPassword() {
  const { token, error } = Route.useSearch();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    validators: { onChange: newPasswordSchema },
    onSubmit: async ({ value }) => {
      if (!token) return;
      const { error: resetError } = await auth.resetPassword({ newPassword: value.password, token });
      if (resetError) {
        toast.error(resetError.message ?? 'This reset link is invalid or has expired');
        return;
      }
      toast.success('Password updated. Log in with your new password.');
      await navigate({ to: '/sign-in' });
    },
  });

  if (!token || error) {
    return (
      <AuthShell title="Link expired" description="This reset link is invalid or has already been used.">
        <FieldDescription className="text-center">
          <Link to="/forgot-password">Request a new link</Link>
        </FieldDescription>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" description="Your other sessions will be signed out.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="password">
            {(field) => (
              <TextField
                field={field}
                label="New password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 14 characters"
              />
            )}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => (
              <TextField
                field={field}
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your new password"
              />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button className="w-full" type="submit" disabled={!canSubmit}>
                {isSubmitting ? 'Saving…' : 'Update password'}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
