import { Button } from '@frontend/components/ui/button';
import { routeTree } from '@frontend/routeTree.gen';
import { QueryClient } from '@tanstack/react-query';
import { createRouter, Link } from '@tanstack/react-router';

export function getRouter() {
  const queryClient = new QueryClient();

  return createRouter({
    routeTree,
    context: { queryClient },
    defaultErrorComponent: ({ error, reset }) => (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="font-bold text-2xl">Error!</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
        <Button onClick={reset} variant="outline">
          Reset
        </Button>
        <Button render={<Link to="/" />} nativeButton={false} variant="link">
          Go home
        </Button>
      </div>
    ),
    defaultNotFoundComponent: () => (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="font-bold text-2xl">Not found!</p>
        <Link to="/" className="text-blue-500 hover:text-blue-600">
          Go home
        </Link>
      </div>
    ),
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
