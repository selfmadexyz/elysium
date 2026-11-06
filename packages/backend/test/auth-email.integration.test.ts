import { afterAll, describe, expect, it, spyOn } from 'bun:test';
import { app } from '@backend/app';
import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { logger } from '@backend/lib/logger';
import { eq, like } from 'drizzle-orm';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === '1';
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const prefix = `auth-email-${crypto.randomUUID()}`;
const headers = { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' };

const clientIp = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

const post = (path: string, body: unknown, ip = clientIp, extraHeaders: Record<string, string> = {}) =>
  app.handle(
    new Request(`http://localhost:3001/api/auth${path}`, {
      method: 'POST',
      headers: { ...headers, 'X-Forwarded-For': ip, ...extraHeaders },
      body: JSON.stringify(body),
    }),
  );

async function nextEmailLink(template: string, action: () => Promise<unknown>) {
  const info = spyOn(logger, 'info');
  try {
    await action();
    for (let attempt = 0; attempt < 50; attempt++) {
      const call = info.mock.calls.find(([, attributes]) => attributes?.['email.template'] === template);
      const link = call?.[0].match(/https?:\/\/\S+/)?.[0];
      if (link) return new URL(link);
      await Bun.sleep(10);
    }
    throw new Error(`No ${template} email was sent`);
  } finally {
    info.mockRestore();
  }
}

const cookieHeader = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');

describeDatabase('email verification and password reset', () => {
  afterAll(async () => {
    await db.delete(table.user).where(like(table.user.email, `${prefix}%`));
  });

  it('blocks sign-in until the emailed verification link is opened', async () => {
    const credentials = {
      email: `${prefix}-verify@example.com`,
      password: 'verification-test-password-42',
      name: 'Ada',
    };

    const verifyLink = await nextEmailLink('verify-email', async () => {
      expect((await post('/sign-up/email', { ...credentials, callbackURL: '/posts' })).status).toBe(200);
    });

    const blocked = await post('/sign-in/email', credentials);
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });

    const verified = await app.handle(new Request(`http://localhost:3001${verifyLink.pathname}${verifyLink.search}`));
    expect(verified.status).toBe(302);
    expect(verified.headers.get('location')).toBe('/posts');
    expect(cookieHeader(verified)).toContain('session_token=');

    const [user] = await db.select().from(table.user).where(eq(table.user.email, credentials.email));
    expect(user?.emailVerified).toBe(true);
    expect((await post('/sign-in/email', credentials)).status).toBe(200);
  });

  it('resets a password through the emailed link and revokes existing sessions', async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
    const credentials = { email: `${prefix}-reset@example.com`, password: 'original-test-password-42', name: 'Grace' };
    await post('/sign-up/email', credentials, ip);
    await db.update(table.user).set({ emailVerified: true }).where(eq(table.user.email, credentials.email));
    const oldSession = cookieHeader(await post('/sign-in/email', credentials, ip));

    const resetLink = await nextEmailLink('reset-password', async () => {
      const response = await post('/request-password-reset', {
        email: credentials.email,
        redirectTo: '/reset-password',
      });
      expect(response.status).toBe(200);
    });

    const redirect = await app.handle(new Request(`http://localhost:3001${resetLink.pathname}${resetLink.search}`));
    expect(redirect.status).toBe(302);
    const callback = new URL(redirect.headers.get('location') ?? '', 'http://localhost:3000');
    expect(callback.pathname).toBe('/reset-password');
    const token = callback.searchParams.get('token');
    expect(token).toBeTruthy();

    const newPassword = 'replacement-test-password-42';
    expect((await post('/reset-password', { token, newPassword })).status).toBe(200);
    expect((await post('/reset-password', { token, newPassword: 'another-test-password-42' })).status).toBe(400);

    expect((await post('/sign-in/email', credentials, ip)).status).toBe(401);
    expect((await post('/sign-in/email', { ...credentials, password: newPassword }, ip)).status).toBe(200);
    const session = await app.handle(
      new Request('http://localhost:3001/api/auth/get-session', { headers: { Cookie: oldSession } }),
    );
    expect(await session.json()).toBeNull();
  });

  it('deletes an account and its posts only after the emailed confirmation link is opened', async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
    const credentials = { email: `${prefix}-delete@example.com`, password: 'deletion-test-password-42', name: 'Linus' };
    await post('/sign-up/email', credentials, ip);
    await db.update(table.user).set({ emailVerified: true }).where(eq(table.user.email, credentials.email));
    const cookie = cookieHeader(await post('/sign-in/email', credentials, ip));
    const [user] = await db.select().from(table.user).where(eq(table.user.email, credentials.email));
    if (!user) throw new Error('fixture user missing');
    await db.insert(table.postsTable).values({ title: 'Doomed', body: 'Deleted with the account', authorId: user.id });

    const deleteLink = await nextEmailLink('delete-account', async () => {
      const response = await post('/delete-user', { callbackURL: '/' }, ip, { Cookie: cookie });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true, message: 'Verification email sent' });
    });
    expect(await db.select().from(table.user).where(eq(table.user.id, user.id))).toHaveLength(1);

    const confirmed = await app.handle(
      new Request(`http://localhost:3001${deleteLink.pathname}${deleteLink.search}`, { headers: { Cookie: cookie } }),
    );
    expect(confirmed.status).toBe(302);
    expect(confirmed.headers.get('location')).toBe('/');
    expect(await db.select().from(table.user).where(eq(table.user.id, user.id))).toEqual([]);
    expect(await db.select().from(table.postsTable).where(eq(table.postsTable.authorId, user.id))).toEqual([]);
  });

  it('answers password reset requests for unknown emails without sending mail', async () => {
    const info = spyOn(logger, 'info');
    try {
      const response = await post('/request-password-reset', {
        email: `${prefix}-nobody@example.com`,
        redirectTo: '/reset-password',
      });
      expect(response.status).toBe(200);
      await Bun.sleep(20);
      expect(info.mock.calls.some(([, attributes]) => attributes?.['email.template'] === 'reset-password')).toBe(false);
    } finally {
      info.mockRestore();
    }
  });
});
