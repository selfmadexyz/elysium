import * as schema from '@backend/database/schema';
import { env } from '@backend/env';
import { db } from '@backend/lib/db';
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
    storage: 'memory',
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
