import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth } = await import('@backend/modules/auth/auth');
  return auth.api.getSession({ headers: getRequestHeaders() });
});
