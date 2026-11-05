import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders, getResponseHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders();
  const { auth } = await import('@backend/modules/auth/auth');

  const { response, headers: sessionHeaders } = await auth.api.getSession({ headers, returnHeaders: true });
  for (const cookie of sessionHeaders.getSetCookie()) {
    getResponseHeaders().append('set-cookie', cookie);
  }

  return response;
});
