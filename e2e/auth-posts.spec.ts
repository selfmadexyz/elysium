import { type APIRequestContext, expect, test } from '@playwright/test';
import { Client } from 'pg';

const databaseUrl = process.env.E2E_DATABASE_URL;
const password = 'Elysium-test-password-123!';

async function database() {
  if (!databaseUrl || !/^elysium_(test|e2e)$/.test(new URL(databaseUrl).pathname.slice(1))) {
    throw new Error('E2E_DATABASE_URL must point to an isolated elysium_test or elysium_e2e database');
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

async function signIn(request: APIRequestContext) {
  const email = `browser-${crypto.randomUUID()}@example.invalid`;
  const signup = await request.post('/api/auth/sign-up/email', {
    data: { email, password, name: 'Browser fixture' },
  });
  expect(signup.ok()).toBe(true);
  const { user } = await signup.json();
  expect((await request.post('/api/auth/sign-in/email', { data: { email, password } })).ok()).toBe(true);
  return user.id as string;
}

test('the protected route forwards renewed session cookies to the browser', async ({ page }) => {
  const db = await database();
  let userId: string | undefined;
  try {
    userId = await signIn(page.request);
    const before = (await page.context().cookies()).find((cookie) => cookie.name.includes('session_token'));
    expect(before).toBeDefined();
    await db.query("UPDATE session SET expires_at = NOW() + INTERVAL '3 days' WHERE user_id = $1", [userId]);
    const response = await page.goto('/posts');
    expect(response?.ok()).toBe(true);
    expect(
      (await response?.headersArray())?.some(
        (header) => header.name.toLowerCase() === 'set-cookie' && header.value.includes('session_token'),
      ),
    ).toBe(true);
    await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible();
    const after = (await page.context().cookies()).find((cookie) => cookie.name.includes('session_token'));
    expect(after?.value).toBe(before?.value);
    expect(after?.expires).toBeGreaterThan(Math.floor(Date.now() / 1000) + 6 * 86_400);
    const result = await db.query('SELECT expires_at FROM session WHERE user_id = $1', [userId]);
    expect(new Date(result.rows[0].expires_at).getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000);
  } finally {
    if (userId) await db.query('DELETE FROM "user" WHERE id = $1', [userId]);
    await db.end();
  }
});

test('all posts remain reachable and deleting a final page returns to the previous page', async ({ page }) => {
  const db = await database();
  let userId: string | undefined;
  try {
    userId = await signIn(page.request);
    for (let index = 1; index <= 21; index++) {
      await db.query('INSERT INTO posts (title, body, author_id) VALUES ($1, $2, $3)', [
        `Post ${index}`,
        `Pagination fixture ${index}`,
        userId,
      ]);
    }
    const initialPage = await page.goto('/posts');
    expect(await initialPage?.text()).not.toContain('Pagination fixture');
    await expect(page.getByRole('row')).toHaveCount(21);
    await expect(page.getByRole('cell', { name: 'Post 21', exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('posts-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('navigation', { name: 'Posts pagination' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('posts-mobile.png'), fullPage: true });
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Post 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await page.getByRole('button', { name: 'Delete post', exact: true }).click();
    await page.getByRole('button', { name: 'Delete Post', exact: true }).click();
    await expect(page.getByText('Page 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(21);
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await page.getByRole('button', { name: 'Create Post', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Newest post');
    await page.getByLabel('Body', { exact: true }).fill('Created through the real browser form');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Post', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Newest post', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  } finally {
    if (userId) await db.query('DELETE FROM "user" WHERE id = $1', [userId]);
    await db.end();
  }
});
