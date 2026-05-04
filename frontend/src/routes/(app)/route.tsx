import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/(app)')({
  component: RouteComponent,
});

function RouteComponent() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  return (
    <div className="relative flex">
      <div className="bg-brand-600 fixed z-20 flex w-screen justify-center border-b border-gray-200 py-4">
        <div className="flex w-full max-w-7xl justify-between">
          <div className="flex items-center gap-4">
            <Link className="font-bold text-white" to="/artifacts">
              <h3>NenuScanner</h3>
            </Link>
            <Link to="/artifacts">
              <span
                className={cn(
                  'rounded-sm px-4 py-2 text-lg',
                  pathname.startsWith('/camera') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
                )}
              >
                Caméra
              </span>
            </Link>
            <Link to="/artifacts">
              <span
                className={cn(
                  'rounded-sm px-4 py-2 text-lg',
                  pathname.startsWith('/camera') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
                )}
              >
                Leds
              </span>
            </Link>
          </div>
          {/* <div className="flex items-center gap-2">
          <Link to="/profile">
            <UserCircle2 />
          </Link>
          <Button
            onClick={() => {
              logoutMutate();
            }}
            size="sm"
            variant="outline"
          >
            Log out
          </Button>
        </div> */}
        </div>
      </div>
      <div className="mt-[65px] flex min-h-[calc(100vh-65px)] w-full flex-col">
        <Outlet />
      </div>
    </div>
  );
}
