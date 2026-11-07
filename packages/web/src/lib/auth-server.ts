import { createServerFn } from '@tanstack/react-start';
import { appendResponseHeader, getRequestHeaders } from '@tanstack/react-start/server';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders();
  const { auth } = await import('@backend/modules/auth/auth');

  const { response, headers: sessionHeaders } = await auth.api.getSession({ headers, returnHeaders: true });
  const cookies = sessionHeaders.getSetCookie();
  if (cookies.length > 0) {
    appendResponseHeader('set-cookie', cookies);
  }

  return response;
});
