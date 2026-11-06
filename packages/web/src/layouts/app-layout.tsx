import { Button } from '@frontend/components/ui/button';
import { auth } from '@frontend/lib/auth';
import { Link, Outlet, useNavigate, useRouteContext } from '@tanstack/react-router';

export const AppLayout = () => {
  const { session } = useRouteContext({ from: '/_authenticated' });
  const navigate = useNavigate();

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <Link to="/" className="rounded-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">
            Elysium
          </Link>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ 'aria-current': 'page', className: 'font-semibold' }}
              className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Home
            </Link>
            <Link
              to="/posts"
              activeProps={{ 'aria-current': 'page', className: 'font-semibold' }}
              className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Posts
            </Link>
            <Link
              to="/account"
              activeProps={{ 'aria-current': 'page', className: 'font-semibold' }}
              className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Account
            </Link>
          </nav>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <div className="min-w-0 text-sm">
              <p className="break-all font-medium">{session.user.name}</p>
              <p className="break-all text-muted-foreground">{session.user.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await auth.signOut();
                navigate({ to: '/sign-in', reloadDocument: true });
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
};
