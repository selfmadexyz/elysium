import { describe, expect, it } from 'bun:test';
import { app } from '@backend/app';

describe('backend app', () => {
  it('can be imported without opening a listening socket', () => {
    expect(app.server).toBeNull();
    expect(typeof app.fetch).toBe('function');
  });

  it('serves health checks through the in-memory handler', async () => {
    const response = await app.handle(new Request('http://localhost/api/health/'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: 'healthy' });
  });
});
