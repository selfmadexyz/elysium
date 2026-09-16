import type { App } from '@backend/app';
import { treaty } from '@elysiajs/eden';

const origin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;

export const client = treaty<App>(origin, {
  fetch: {
    credentials: 'include',
  },
});
