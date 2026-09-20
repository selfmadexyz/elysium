/// <reference types="vite/client" />

import { RootLayout } from '@frontend/components/root-layout';
import '@frontend/styles.css';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#000000' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <RootLayout />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
