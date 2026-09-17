import { createApp } from '@backend/app';
import { InternalServerError, NotFoundError, ServerError } from '@backend/lib/errors';
import { t } from 'elysia';

const cause = new Error('private database cause');
const app = createApp()
  .get('/test/unexpected', async () => {
    throw new Error('private unexpected detail', { cause });
  })
  .get('/test/internal', () => {
    throw new InternalServerError('private internal detail', cause);
  })
  .get('/test/unavailable', () => {
    throw new ServerError(503, 'private unavailable detail', cause);
  })
  .get('/test/not-found', () => {
    throw new NotFoundError('Post with id 1 not found');
  })
  .post('/test/body', ({ body }) => body, { body: t.Object({ title: t.String() }) });

const requests = {
  unexpected: new Request('http://localhost/test/unexpected'),
  internal: new Request('http://localhost/test/internal'),
  unavailable: new Request('http://localhost/test/unavailable'),
  notFound: new Request('http://localhost/test/not-found'),
  missingRoute: new Request('http://localhost/test/missing'),
  validation: new Request('http://localhost/test/body', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: { password: 'validation-secret-sentinel' } }),
  }),
  parse: new Request('http://localhost/test/body', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  }),
};

const responses = Object.fromEntries(
  await Promise.all(
    Object.entries(requests).map(async ([name, request]) => {
      const response = await app.handle(request);
      return [name, { status: response.status, body: await response.json() }];
    }),
  ),
);

console.log(JSON.stringify(responses));
