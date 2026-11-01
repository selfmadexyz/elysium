type SeoInput = {
  title: string;
  description: string;
  path?: string;
};

export const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function seo({ title, description, path = '/' }: SeoInput) {
  const canonical = new URL(path, `${siteUrl}/`).toString();
  const image = new URL('/logo512.png', `${siteUrl}/`).toString();

  return {
    canonical,
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Elysium' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
  };
}
