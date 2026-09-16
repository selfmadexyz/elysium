import { siteUrl } from '@frontend/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const urls = ['/', '/get-started'];
        const entries = urls.map((path) => `<url><loc>${new URL(path, siteUrl)}</loc></url>`).join('');

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
          {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
          },
        );
      },
    },
  },
});
