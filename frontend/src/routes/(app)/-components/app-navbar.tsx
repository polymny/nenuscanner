import { Link } from '@tanstack/react-router';
import { memo } from 'react';
import ProfileMenuWidget from './profile-menu-widget';
import CreateGlobalAcquisitionDialog from './create-global-acquisition-dialog';
import IncreaseRigConfigurationDialog from './increase-rig-configuration-dialog';
import { cn } from '@/lib/utils';

interface AppNavbarProps {
  pathname: string;
}

const AppNavLinks = memo(function AppNavLinks({ pathname }: AppNavbarProps) {
  return (
    <div className="flex items-center gap-4">
      <Link to="/artifacts">
        <span
          className={cn(
            'rounded-sm px-4 py-2 text-lg',
            pathname.startsWith('/artifacts') ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-white'
          )}
        >
          Objets
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
    </div>
  );
});

const AppNavbar = memo(function AppNavbar({ pathname }: AppNavbarProps) {
  return (
    <div className="bg-brand-600 fixed z-20 flex w-screen justify-center border-b border-gray-200 py-4">
      <div className="flex w-full justify-between px-32">
        <div className="flex items-center gap-4">
          <Link className="font-bold text-white" to="/artifacts">
            <h3>NenuScanner</h3>
          </Link>
          <CreateGlobalAcquisitionDialog />
          <IncreaseRigConfigurationDialog />
        </div>
        <div className="flex items-center gap-2">
          <AppNavLinks pathname={pathname} />
          <ProfileMenuWidget />
        </div>
      </div>
    </div>
  );
});

export default AppNavbar;
