import { seo } from '@frontend/lib/seo';
import { describe, expect, it } from 'vitest';

describe('seo', () => {
  it('creates canonical and social metadata for a route', () => {
    const result = seo({
      title: 'Get started',
      description: 'Install Elysium',
      path: '/get-started',
    });

    expect(result.canonical).toBe('http://localhost:3000/get-started');
    expect(result.meta).toContainEqual({ property: 'og:title', content: 'Get started' });
    expect(result.meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
  });
});
