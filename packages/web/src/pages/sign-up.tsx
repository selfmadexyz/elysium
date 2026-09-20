import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@frontend/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@frontend/components/ui/field';
import { Input } from '@frontend/components/ui/input';
import { auth } from '@frontend/lib/auth';
import { cn } from '@frontend/lib/utils';
import { signUpSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';
import { Link, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';

export function SignUp({ className, ...props }: React.ComponentProps<'div'>) {
  const search = useSearch({
    from: '/sign-up',
  });

  const handleSignUpWithGoogle = async () => {
    const { error } = await auth.signIn.social({
      provider: 'google',
      callbackURL: search.redirect ?? window.location.origin,
    });
    if (error) {
      toast.error(error.message ?? 'Something went wrong');
    }
  };

  const form = useForm({
    defaultValues: {
      name: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onBlur: signUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await auth.signUp.email({
        name: `${value.name} ${value.lastname}`,
        email: value.email,
        password: value.password,
        callbackURL: window.location.origin,
      });
      if (error) {
        toast.error(error.message ?? 'Something went wrong');
        return;
      }
      formApi.reset();
    },
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn('flex flex-col gap-6', className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Sign up to your account</CardTitle>
              <CardDescription>Enter your email below to sign up to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup>
                  <form.Field name="name">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your name"
                            required
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="lastname">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your last name"
                            required
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="email">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your email"
                            required
                            type="email"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>

                  <form.Field name="password">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter your password"
                            type="password"
                            required
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="confirmPassword">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Confirm your password"
                            type="password"
                            required
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>

                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <div className="flex gap-2">
                        <Button className="w-full" type="submit" disabled={!canSubmit}>
                          {isSubmitting ? 'Signing up...' : 'Sign up'}
                        </Button>
                      </div>
                    )}
                  </form.Subscribe>
                  <FieldSeparator>Or continue with</FieldSeparator>
                  <Field>
                    <Button className="w-full" variant="outline" type="button" onClick={handleSignUpWithGoogle}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262">
                        <title>Google</title>
                        <path
                          fill="#4285F4"
                          d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                        ></path>
                        <path
                          fill="#EB4335"
                          d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        ></path>
                      </svg>
                      Sign up with Google
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account? <Link to="/sign-in">Login</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
