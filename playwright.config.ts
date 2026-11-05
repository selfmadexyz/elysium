import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun --no-env-file packages/web/.output/server/index.mjs',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1',
      PORT: '3100',
      NITRO_PORT: '3100',
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/elysium_test',
      BETTER_AUTH_SECRET: 'elysium-e2e-only-secret-do-not-use-in-production',
      BETTER_AUTH_URL: baseURL,
      APP_URL: baseURL,
      GOOGLE_CLIENT_ID: 'e2e-placeholder',
      GOOGLE_CLIENT_SECRET: 'e2e-placeholder',
    },
  },
});
