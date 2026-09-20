import { Toaster } from '@frontend/components/ui/sonner';
import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
