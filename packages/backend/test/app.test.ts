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

  it.each(['production', 'test'])('handles errors with NODE_ENV=%s', async (nodeEnv) => {
    // A separate process exercises the real environment without changing shared imports.
    const child = Bun.spawn([process.execPath, new URL('./fixtures/error-responses.ts', import.meta.url).pathname], {
      env: { ...process.env, NODE_ENV: nodeEnv },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);

    expect(exitCode).toBe(0);
    const responses = JSON.parse(stdout);
    const isProduction = nodeEnv === 'production';
    for (const [name, status, error] of [
      ['unexpected', 500, 'Internal Server Error'],
      ['internal', 500, 'InternalServerError'],
      ['unavailable', 503, 'ServerError'],
    ] as const) {
      expect(responses[name]).toEqual({
        status,
        body: {
          error: isProduction ? 'Internal Server Error' : error,
          message: isProduction ? 'Something went wrong' : `private ${name} detail`,
        },
      });
    }
    expect(responses.notFound).toEqual({
      status: 404,
      body: { error: 'NotFoundError', message: 'Post with id 1 not found' },
    });
    expect(responses.missingRoute).toEqual({
      status: 404,
      body: { error: 'Not Found', message: 'Route not found' },
    });
    expect(responses.parse).toEqual({
      status: 400,
      body: { error: 'Parse Error', message: 'Invalid request format' },
    });
    expect(responses.validation.status).toBe(400);
    expect(responses.validation.body.error).toBe('Validation Error');
    expect('details' in responses.validation.body).toBe(!isProduction);
    expect(stderr).toContain('private internal detail');
    expect(stderr).toContain('private database cause');
    expect(stderr).toContain('error-responses.ts:');
    expect(stderr).not.toContain('validation-secret-sentinel');
    expect(stderr).not.toContain('Post with id 1 not found');
  });
});
