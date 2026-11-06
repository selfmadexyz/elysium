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

const clientIp = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

async function markVerified(email: string) {
  const db = await database();
  try {
    await db.query('UPDATE "user" SET email_verified = true WHERE email = $1', [email]);
  } finally {
    await db.end();
  }
}

async function signIn(request: APIRequestContext) {
  const email = `browser-${crypto.randomUUID()}@example.invalid`;
  const headers = { 'X-Forwarded-For': clientIp() };
  const signup = await request.post('/api/auth/sign-up/email', {
    data: { email, password, name: 'Browser fixture' },
    headers,
  });
  expect(signup.ok()).toBe(true);
  const { user } = await signup.json();
  await markVerified(email);
  expect((await request.post('/api/auth/sign-in/email', { data: { email, password }, headers })).ok()).toBe(true);
  return user.id as string;
}

test('a new account must verify its email before logging in', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'X-Forwarded-For': clientIp() });
  const email = `browser-${crypto.randomUUID()}@example.invalid`;
  try {
    await page.goto('/sign-up');
    await page.getByLabel('Name', { exact: true }).fill('Ada');
    await page.getByLabel('Last name', { exact: true }).fill('Lovelace');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.goto('/sign-in');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByText('Verify your email first.')).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);

    await markVerified(email);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/\/posts$/);
  } finally {
    const db = await database();
    await db.query('DELETE FROM "user" WHERE email = $1', [email]);
    await db.end();
  }
});

test('password reset screens guide the visitor without revealing accounts', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'X-Forwarded-For': clientIp() });
  await page.goto('/sign-in');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Email', { exact: true }).fill(`nobody-${crypto.randomUUID()}@example.invalid`);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();

  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: 'Link expired' })).toBeVisible();
  await page.goto('/reset-password?token=not-a-real-token');
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText(/invalid|expired/i)).toBeVisible();
});

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
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Home', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
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
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    expect(await page.evaluate(async () => (await fetch('/api/posts')).status)).toBe(401);
    await page.goto('/posts');
    await expect(page).toHaveURL(/\/sign-in/);
  } finally {
    if (userId) await db.query('DELETE FROM "user" WHERE id = $1', [userId]);
    await db.end();
  }
});

test('the account page updates the profile, changes the password and requests deletion', async ({ page }) => {
  const db = await database();
  let userId: string | undefined;
  try {
    await page.context().setExtraHTTPHeaders({ 'X-Forwarded-For': clientIp() });
    userId = await signIn(page.request);
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();

    await page.getByLabel('Display name').fill('Renamed fixture');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Profile updated')).toBeVisible();
    await expect(page.getByRole('banner').getByText('Renamed fixture')).toBeVisible();

    const newPassword = 'Elysium-changed-password-456!';
    await page.getByLabel('Current password').fill(password);
    await page.getByLabel('New password', { exact: true }).fill(newPassword);
    await page.getByLabel('Confirm new password').fill(newPassword);
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('Password changed.')).toBeVisible();
    const result = await db.query('SELECT email FROM "user" WHERE id = $1', [userId]);
    const email = result.rows[0].email as string;
    expect((await page.request.post('/api/auth/sign-in/email', { data: { email, password: newPassword } })).ok()).toBe(
      true,
    );

    await page.setViewportSize({ width: 320, height: 844 });
    await page.screenshot({ path: test.info().outputPath('account-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Send confirmation link' }).click();
    await expect(page.getByRole('status')).toContainText('We sent a confirmation link');
    expect((await db.query('SELECT 1 FROM "user" WHERE id = $1', [userId])).rowCount).toBe(1);
  } finally {
    if (userId) await db.query('DELETE FROM "user" WHERE id = $1', [userId]);
    await db.end();
  }
});
