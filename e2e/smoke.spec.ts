import { expect, test } from '@playwright/test';

test('the built server serves the Elysia API', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, status: 'healthy' });
});

for (const path of ['/', '/get-started']) {
  test(`public page ${path} includes its metadata without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\//);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(path === '/' ? '/$' : '/get-started$'),
    );
    expect((await context.cookies()).filter((cookie) => cookie.name.includes('session'))).toEqual([]);
    await context.close();
  });
}

test('the landing page hydrates for navigation on desktop and mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Get Started', exact: true }).click();
    await expect(page).toHaveURL(/\/get-started$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('auth screens expose usable fields without calling an OAuth provider', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
  await expect(page.getByLabel('Password', { exact: true })).toBeEditable();
  await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
});

test('the private app redirects visitors and the API denies access', async ({ page }) => {
  expect((await page.request.get('/api/posts/')).status()).toBe(401);
  await page.goto('/posts');
  await expect(page).toHaveURL(/\/sign-in(?:\?|$)/);
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
});
