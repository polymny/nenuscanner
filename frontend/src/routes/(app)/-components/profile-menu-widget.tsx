import { Link } from '@tanstack/react-router';
import { Check, Settings, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSelectProfile } from '@/api/mutations/profile.mutations';
import { useGetProfiles } from '@/api/queries/profile.queries';
import { cn } from '@/lib/utils';

const ProfileMenuWidget = () => {
  const { data: profiles, isPending: isLoadingProfiles } = useGetProfiles();
  const { mutate: selectProfileMutation } = useSelectProfile({
    onSuccess: (selectedProfile) => {
      toast.success(`Profil "${selectedProfile.name}" sélectionné`);
    },
    onError: () => {
      toast.error('La sélection du profil a échoué');
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="text-white" size="icon" type="button" variant="link">
          <UserCircle2 className="size-6" />
          <span className="sr-only">Profils</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Profils</DropdownMenuLabel>
          {isLoadingProfiles ? (
            <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
          ) : !profiles?.length ? (
            <DropdownMenuItem disabled>Aucun profil</DropdownMenuItem>
          ) : (
            profiles.map((profile) => (
              <DropdownMenuItem
                className={cn(
                  'focus:bg-brand-50 cursor-pointer pl-8',
                  profile.isActive && 'bg-brand-100 focus:bg-brand-100'
                )}
                key={profile.id}
                onSelect={(event) => {
                  event.preventDefault();
                  selectProfileMutation(profile.id);
                }}
              >
                <Check className={cn('absolute left-2 size-4', profile.isActive ? 'text-brand-600' : 'invisible')} />
                {profile.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="w-full cursor-pointer" to="/profiles">
            <Settings />
            Gérer mes profils
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenuWidget;
