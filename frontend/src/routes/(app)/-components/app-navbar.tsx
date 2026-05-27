import { Link } from '@tanstack/react-router';
import { memo } from 'react';
import ArmsPositionWidget from './arms-position-widget';
import ProfileMenuWidget from './profile-menu-widget';
import { cn } from '@/lib/utils';

interface AppNavbarProps {
  pathname: string;
}

const AppNavLinks = memo(function AppNavLinks({ pathname }: AppNavbarProps) {
  return (
    <div className="flex items-center gap-4">
      <Link className="font-bold text-white" to="/artifacts">
        <h3>NenuScanner</h3>
      </Link>
      <Link to="/scenarios">
        <span
          className={cn(
            'rounded-sm px-4 py-2 text-lg',
            pathname.startsWith('/scenarios') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
          )}
        >
          Scénarios
        </span>
      </Link>
      <Link to="/calibrations">
        <span
          className={cn(
            'rounded-sm px-4 py-2 text-lg',
            pathname.startsWith('/calibrations') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
          )}
        >
          Étalonnages
        </span>
      </Link>
      <Link to="/camera-settings">
        <span
          className={cn(
            'rounded-sm px-4 py-2 text-lg',
            pathname.startsWith('/camera-settings') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
          )}
        >
          Caméra
        </span>
      </Link>
      <Link to="/artifacts">
        <span
          className={cn(
            'rounded-sm px-4 py-2 text-lg',
            pathname.startsWith('/leds') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
          )}
        >
          Leds
        </span>
      </Link>
    </div>
  );
});

const AppNavbar = memo(function AppNavbar({ pathname }: AppNavbarProps) {
  return (
    <div className="bg-brand-600 fixed z-20 flex w-screen justify-center border-b border-gray-200 py-4">
      <div className="flex w-full max-w-7xl justify-between">
        <AppNavLinks pathname={pathname} />
        <div className="flex items-center gap-2">
          <ArmsPositionWidget />
          <ProfileMenuWidget />
        </div>
      </div>
    </div>
  );
});

export default AppNavbar;
