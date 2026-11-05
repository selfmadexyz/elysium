import * as schema from '@backend/database/schema';
import { env } from '@backend/env';
import { db } from '@backend/lib/db';
import { deliverInBackground } from '@backend/lib/email';
import { deleteAccountEmail, resetPasswordEmail, verificationEmail } from '@backend/modules/auth/emails';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      requireEmailVerification: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 14,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      deliverInBackground(resetPasswordEmail(user, url));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      deliverInBackground(verificationEmail(user, url));
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 60 * 60,
      sendDeleteAccountVerification: async ({ user, url }) => {
        deliverInBackground(deleteAccountEmail(user, url));
      },
    },
  },
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: 'database',
    accountLinking: {
      disableImplicitLinking: true,
      allowDifferentEmails: false,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'database',
    modelName: 'rateLimit',
    customRules: {
      '/request-password-reset': { window: 60, max: 3 },
      '/send-verification-email': { window: 60, max: 3 },
      '/delete-user': { window: 60, max: 3 },
    },
  },
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.APP_URL, env.BETTER_AUTH_URL],
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    },
  },
});
