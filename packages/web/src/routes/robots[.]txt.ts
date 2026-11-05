import { siteUrl } from '@frontend/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const sitemap = new URL('/sitemap.xml', siteUrl);
        const body = [
          'User-agent: *',
          'Allow: /',
          'Disallow: /posts',
          'Disallow: /sign-in',
          'Disallow: /sign-up',
          `Sitemap: ${sitemap}`,
        ].join('\n');

        return new Response(body, {
          headers: {
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      },
    },
  },
});
