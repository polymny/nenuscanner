import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import AppNavbar from './-components/app-navbar';

export const Route = createFileRoute('/(app)')({
  component: RouteComponent,
});

function RouteComponent() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  return (
    <div className="relative flex">
      <AppNavbar pathname={pathname} />
      <div className="mt-[65px] flex min-h-[calc(100vh-65px)] w-full flex-col">
        <Outlet />
      </div>
    </div>
  );
}
