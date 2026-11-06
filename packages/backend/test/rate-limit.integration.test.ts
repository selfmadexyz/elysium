import { afterAll, describe, expect, it } from 'bun:test';
import { app } from '@backend/app';
import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { like } from 'drizzle-orm';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === '1';
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const ip = `192.0.2.${Math.floor(Math.random() * 250) + 1}`;

const requestReset = (clientIp: string) =>
  app.handle(
    new Request('http://localhost:3001/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', 'X-Forwarded-For': clientIp },
      body: JSON.stringify({ email: 'nobody@example.invalid', redirectTo: '/reset-password' }),
    }),
  );

describeDatabase('auth rate limiting', () => {
  afterAll(async () => {
    await db.delete(table.rateLimit).where(like(table.rateLimit.key, `${ip}%`));
    await db.delete(table.rateLimit).where(like(table.rateLimit.key, '192.0.2.252%'));
  });

  it('stores counters in PostgreSQL and limits password reset requests per client', async () => {
    const statuses = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      statuses.push((await requestReset(ip)).status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    const rows = await db
      .select()
      .from(table.rateLimit)
      .where(like(table.rateLimit.key, `${ip}%`));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toContain('/request-password-reset');
    expect(rows[0]?.count).toBe(3);
    expect((await requestReset('192.0.2.252')).status).not.toBe(429);
  });
});
