import z from 'zod';

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  body: z.string().min(1, 'Body is required'),
});

export const passwordSchema = z.string().min(14, 'Use at least 14 characters').max(128);

export const signUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    lastname: z.string().min(1, 'Last name is required'),
    email: z.email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .refine((value) => {
      if (!value.startsWith('/') || value.includes('\\')) return false;

      const localOrigin = 'https://elysium.invalid';
      return new URL(value, localOrigin).origin === localOrigin;
    }, 'Redirect must stay on this site')
    .optional(),
});
