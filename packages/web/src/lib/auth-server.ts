import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ auth }, headers] = await Promise.all([
    import('@backend/modules/auth/auth'),
    Promise.resolve(getRequestHeaders()),
  ]);

  return auth.api.getSession({ headers });
});
