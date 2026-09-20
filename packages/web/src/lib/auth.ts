import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
  fetchOptions: {
    credentials: 'include',
    mode: 'cors',
  },
});
