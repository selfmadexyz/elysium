import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders, getResponseHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ auth }, headers] = await Promise.all([
    import('@backend/modules/auth/auth'),
    Promise.resolve(getRequestHeaders()),
  ]);

  const { response, headers: sessionHeaders } = await auth.api.getSession({ headers, returnHeaders: true });
  for (const cookie of sessionHeaders.getSetCookie()) {
    getResponseHeaders().append('set-cookie', cookie);
  }

  return response;
});
