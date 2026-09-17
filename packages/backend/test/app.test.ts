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

  it('rejects unauthenticated post reads', async () => {
    const response = await app.handle(new Request('http://localhost/api/posts/'));

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  });
});
