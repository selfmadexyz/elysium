import { expect, test } from 'bun:test';
import { health } from './index';

test('health endpoint responds with live process status', async () => {
  const response = await health.handle(new Request('http://localhost/health/'));
  expect(response.status).toBe(200);
  const body = (await response.json()) as { success: boolean; status: string; timestamp: string; uptime: number };
  expect(body.success).toBe(true);
  expect(body.status).toBe('healthy');
  expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  expect(body.uptime).toBeGreaterThanOrEqual(0);
});
