import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
  baseURL: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
  fetchOptions: {
    credentials: 'include',
    mode: 'cors',
  },
});
