import { afterEach, describe, expect, it } from 'bun:test';
import { app } from '@backend/app';
import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { NotFoundError, ServerError } from '@backend/lib/errors';
import { auth } from '@backend/modules/auth/auth';
import { authMiddleware } from '@backend/modules/auth/middleware';
import { postsService } from '@backend/modules/posts/service';
import { eq, inArray } from 'drizzle-orm';
import { Elysia } from 'elysia';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === '1';
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const testId = crypto.randomUUID();
const aliceId = `posts-test-alice-${testId}`;
const bobId = `posts-test-bob-${testId}`;
const userIds = [aliceId, bobId];

async function seedUsers() {
  await db.insert(table.user).values([
    { id: aliceId, name: 'Alice', email: `${aliceId}@example.com` },
    { id: bobId, name: 'Bob', email: `${bobId}@example.com` },
  ]);
}

describeDatabase('posts service PostgreSQL integration', () => {
  afterEach(async () => {
    await db.delete(table.user).where(inArray(table.user.id, userIds));
  });

  it('assigns the authenticated author and lists only their posts', async () => {
    await seedUsers();
    const alicePost = await postsService.create(aliceId, { title: 'Alice post', body: 'Alice body' });
    await postsService.create(bobId, { title: 'Bob post', body: 'Bob body' });

    expect(alicePost).toMatchObject({ authorId: aliceId, title: 'Alice post', body: 'Alice body' });
    expect(await postsService.list(aliceId)).toEqual([alicePost]);
    expect(await postsService.list(aliceId, { limit: 1, offset: 1 })).toEqual([]);
  });

  it('pages through more than twenty posts in newest-first order without mixing authors', async () => {
    await seedUsers();
    const alicePosts = [];
    for (let index = 0; index < 25; index++) {
      alicePosts.push(await postsService.create(aliceId, { title: `Alice ${index}`, body: `Body ${index}` }));
      if (index % 5 === 0) {
        await postsService.create(bobId, { title: `Bob ${index}`, body: 'Private to Bob' });
      }
    }

    const expectedIds = alicePosts.map((post) => post.id).reverse();
    const defaultPage = await postsService.list(aliceId);
    const firstWindow = await postsService.list(aliceId, { limit: 21, offset: 0 });
    const secondWindow = await postsService.list(aliceId, { limit: 21, offset: 20 });

    expect(defaultPage.map((post) => post.id)).toEqual(expectedIds.slice(0, 20));
    expect(firstWindow.map((post) => post.id)).toEqual(expectedIds.slice(0, 21));
    expect(secondWindow.map((post) => post.id)).toEqual(expectedIds.slice(20));
    expect([...firstWindow.slice(0, 20), ...secondWindow].map((post) => post.id)).toEqual(expectedIds);
    expect([...firstWindow, ...secondWindow].every((post) => post.authorId === aliceId)).toBe(true);
    expect(await postsService.list(aliceId, { limit: 21, offset: 40 })).toEqual([]);
  });

  it('rejects fractional pagination and post IDs at the authenticated HTTP boundary', async () => {
    const email = `posts-http-${testId}@example.com`;
    const credentials = { email, password: 'pagination-test-password-42', name: 'Pagination tester' };
    const request = (path: string, init?: RequestInit) =>
      app.handle(new Request(`http://localhost:3001/api${path}`, init));
    const headers = { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' };

    try {
      const signUp = await request('/auth/sign-up/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });
      expect(signUp.status).toBe(200);
      const signIn = await request('/auth/sign-in/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });
      expect(signIn.status).toBe(200);
      const cookie = signIn.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      expect(cookie).toContain('session_token=');
      for (const offset of [0, 10_020]) {
        const response = await request(`/posts/?limit=21&offset=${offset}`, { headers: { Cookie: cookie } });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
      }

      for (const path of [
        '/posts/?limit=1.5',
        '/posts/?offset=0.5',
        '/posts/?offset=9007199254740992',
        '/posts/1.5',
        '/posts/0',
        '/posts/2147483648',
      ]) {
        const response = await request(path, { headers: { Cookie: cookie } });
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ error: 'Validation Error' });
      }
    } finally {
      await db.delete(table.user).where(eq(table.user.email, email));
    }
  });

  it('renews aged API sessions and preserves separate response cookies', async () => {
    const email = `posts-session-${testId}@example.com`;
    const credentials = { email, password: 'session-renewal-test-password-42', name: 'API session tester' };

    try {
      const { user } = await auth.api.signUpEmail({ body: credentials });
      const signIn = await auth.api.signInEmail({ body: credentials, returnHeaders: true });
      const cookie = signIn.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      const ageSession = () =>
        db
          .update(table.session)
          .set({ updatedAt: new Date(Date.now() - 2 * 86_400_000), expiresAt: new Date(Date.now() + 60_000) })
          .where(eq(table.session.userId, user.id));

      await ageSession();
      const response = await app.handle(
        new Request('http://localhost:3001/api/posts/', { headers: { Cookie: cookie } }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.getSetCookie()).toContainEqual(
        expect.stringMatching(/^better-auth\.session_token=.+;.*HttpOnly/),
      );
      const [renewed] = await db.select().from(table.session).where(eq(table.session.userId, user.id));
      expect(renewed?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 86_400_000);

      await ageSession();
      const withOtherCookies = new Elysia()
        .onRequest(({ set }) => {
          set.headers['set-cookie'] = ['other_a=1; Path=/', 'other_b=2; Path=/'];
        })
        .use(authMiddleware)
        .get('/private', ({ user: authenticatedUser }) => authenticatedUser.id, { auth: true });
      const withCookies = await withOtherCookies.handle(
        new Request('http://localhost:3001/private', { headers: { Cookie: cookie } }),
      );
      expect(withCookies.status).toBe(200);
      expect(await withCookies.text()).toBe(user.id);
      const cookies = withCookies.headers.getSetCookie();
      expect(cookies).toHaveLength(3);
      expect(cookies).toContain('other_a=1; Path=/');
      expect(cookies).toContain('other_b=2; Path=/');
      expect(cookies).toContainEqual(expect.stringMatching(/^better-auth\.session_token=.+;.*HttpOnly/));
    } finally {
      await db.delete(table.user).where(eq(table.user.email, email));
    }
  });

  it("does not expose or mutate another author's post", async () => {
    await seedUsers();
    const bobPost = await postsService.create(bobId, { title: 'Bob post', body: 'Bob body' });

    await expect(postsService.get(bobPost.id, aliceId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(postsService.update(bobPost.id, aliceId, { title: 'Stolen' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(postsService.delete(bobPost.id, aliceId)).rejects.toBeInstanceOf(NotFoundError);
    expect(await postsService.get(bobPost.id, bobId)).toEqual(bobPost);

    expect(await postsService.update(bobPost.id, bobId, { title: 'Bob updated' })).toMatchObject({
      id: bobPost.id,
      authorId: bobId,
      title: 'Bob updated',
    });
    await postsService.delete(bobPost.id, bobId);
    await expect(postsService.get(bobPost.id, bobId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected database errors without wrapping them', async () => {
    await seedUsers();
    const error = await postsService
      .create(aliceId, { title: 'x'.repeat(256), body: 'Too long for the database column' })
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ServerError);
  });
});
