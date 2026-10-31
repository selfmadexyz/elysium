import { expect, test } from '@playwright/test';

test('the built server serves the Elysia API', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, status: 'healthy' });
});

test('the landing page renders on the server and hydrates for navigation', async ({ page, request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('Build Modern Apps');

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Build Modern Apps With Less Boilerplate' })).toBeVisible();
  await page.getByRole('button', { name: 'Get Started', exact: true }).click();
  await expect(page).toHaveURL(/\/get-started$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('sign-in exposes usable fields without calling an OAuth provider', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByText('Login to your account', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
  await expect(page.getByLabel('Password', { exact: true })).toBeEditable();
  await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();

  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
});
