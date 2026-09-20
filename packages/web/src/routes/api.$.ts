import { createFileRoute } from '@tanstack/react-router';

const handle = async ({ request }: { request: Request }) => {
  const { app } = await import('@backend/index');
  return app.fetch(request);
};

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
      OPTIONS: handle,
    },
  },
});
