import { auth } from '@backend/modules/auth/auth';
import { Elysia } from 'elysia';

export const authMiddleware = new Elysia({ name: 'auth-middleware' }).mount(auth.handler).macro({
  auth: {
    async resolve({ status, set, request: { headers } }) {
      const { response: session, headers: sessionHeaders } = await auth.api.getSession({
        headers,
        returnHeaders: true,
      });

      const cookies = sessionHeaders.getSetCookie();
      if (cookies.length > 0) {
        const existing = set.headers['set-cookie'];
        set.headers['set-cookie'] = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), ...cookies];
      }

      if (!session) {
        return status(401, {
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
