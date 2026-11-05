import { AuthShell } from '@frontend/components/auth/auth-shell';
import { TextField } from '@frontend/components/auth/text-field';
import { Button } from '@frontend/components/ui/button';
import { FieldDescription, FieldGroup } from '@frontend/components/ui/field';
import { auth } from '@frontend/lib/auth';
import { seo } from '@frontend/lib/seo';
import { forgotPasswordSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

const metadata = seo({
  title: 'Forgot password — Elysium',
  description: 'Reset your Elysium password.',
  path: '/forgot-password',
});

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
  head: () => ({
    meta: [...metadata.meta, { name: 'robots', content: 'noindex, nofollow' }],
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
});

function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string>();

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      const { error } = await auth.requestPasswordReset({ email: value.email, redirectTo: '/reset-password' });
      if (error) {
        toast.error(error.message ?? 'Something went wrong');
        return;
      }
      setSentTo(value.email);
    },
  });

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox" description={`If an account exists for ${sentTo}, we sent a reset link.`}>
        <FieldDescription className="text-center">
          The link expires in 1 hour. <Link to="/sign-in">Back to log in</Link>
        </FieldDescription>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" description="Enter your email and we will send you a reset link.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="email">
            {(field) => (
              <TextField field={field} label="Email" type="email" autoComplete="email" placeholder="Enter your email" />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button className="w-full" type="submit" disabled={!canSubmit}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            )}
          </form.Subscribe>
          <FieldDescription className="text-center">
            Remembered it? <Link to="/sign-in">Log in</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
