import { TextField } from '@frontend/components/auth/text-field';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frontend/components/ui/alert-dialog';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { FieldGroup } from '@frontend/components/ui/field';
import { auth } from '@frontend/lib/auth';
import { seo } from '@frontend/lib/seo';
import { changePasswordSchema, profileSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouteContext, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

const metadata = seo({
  title: 'Account — Elysium',
  description: 'Manage your Elysium account.',
  path: '/account',
});

export const Route = createFileRoute('/_authenticated/account')({
  head: () => ({
    meta: [...metadata.meta, { name: 'robots', content: 'noindex, nofollow' }],
    links: [{ rel: 'canonical', href: metadata.canonical }],
  }),
  ssr: false,
  component: Account,
});

function Account() {
  const { data: accounts } = useQuery({
    queryKey: ['auth', 'accounts'],
    queryFn: async () => {
      const { data, error } = await auth.listAccounts();
      if (error) throw new Error(error.message ?? 'Failed to load sign-in methods');
      return data;
    },
  });
  const hasPassword = accounts?.some((account) => account.providerId === 'credential') ?? false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <ProfileCard />
      {hasPassword && <PasswordCard />}
      <DeleteAccountCard />
    </div>
  );
}

function submitWith(handleSubmit: () => Promise<void>) {
  return (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void handleSubmit();
  };
}

function ProfileCard() {
  const { session } = useRouteContext({ from: '/_authenticated' });
  const router = useRouter();

  const form = useForm({
    defaultValues: { name: session.user.name },
    validators: { onChange: profileSchema },
    onSubmit: async ({ value }) => {
      const { error } = await auth.updateUser({ name: value.name.trim() });
      if (error) {
        toast.error(error.message ?? 'Something went wrong');
        return;
      }
      toast.success('Profile updated');
      await router.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Profile</h2>
        </CardTitle>
        <CardDescription className="break-all">{session.user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitWith(form.handleSubmit)}>
          <FieldGroup>
            <form.Field name="name">
              {(field) => <TextField field={field} label="Display name" autoComplete="name" />}
            </form.Field>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}>
              {([canSubmit, isSubmitting, isDirty]) => (
                <Button className="self-start" type="submit" disabled={!canSubmit || !isDirty}>
                  {isSubmitting ? 'Saving…' : 'Save'}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const form = useForm({
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
    validators: { onChange: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await auth.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.password,
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(error.message ?? 'Something went wrong');
        return;
      }
      formApi.reset();
      toast.success('Password changed. Your other sessions were signed out.');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Password</h2>
        </CardTitle>
        <CardDescription>Changing your password signs out your other devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitWith(form.handleSubmit)}>
          <FieldGroup>
            <form.Field name="currentPassword">
              {(field) => (
                <TextField field={field} label="Current password" type="password" autoComplete="current-password" />
              )}
            </form.Field>
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
                <TextField field={field} label="Confirm new password" type="password" autoComplete="new-password" />
              )}
            </form.Field>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button className="self-start" type="submit" disabled={!canSubmit}>
                  {isSubmitting ? 'Changing…' : 'Change password'}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const { session } = useRouteContext({ from: '/_authenticated' });
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const requestDeletion = async () => {
    setIsSending(true);
    const { error } = await auth.deleteUser({ callbackURL: '/' });
    setIsSending(false);
    setOpen(false);
    if (error) {
      toast.error(error.message ?? 'Something went wrong');
      return;
    }
    setSent(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Delete account</h2>
        </CardTitle>
        <CardDescription>Permanently delete your account and all of your posts.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <output className="block text-sm">
            We sent a confirmation link to <span className="font-medium break-all">{session.user.email}</span>. Your
            account is deleted once you open it.
          </output>
        ) : (
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete account
          </Button>
        )}
      </CardContent>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              We will email you a confirmation link. Opening it permanently deletes your account and posts; this cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={requestDeletion} disabled={isSending}>
              {isSending ? 'Sending…' : 'Send confirmation link'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
